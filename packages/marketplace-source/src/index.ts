import { normalizedListingSchema, type NormalizedListing } from "@marketplace-engine/shared";
import type { FacebookSearchPoint } from "@marketplace-engine/geography";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createInterface } from "node:readline";

export interface SearchListingsInput { query:string; point:FacebookSearchPoint; minPrice?:number; maxPrice?:number; category?:string; limit?:number }
export interface SourceHealth { status:"healthy"|"degraded"|"unavailable"|"auth_required"; message?:string; checkedAt:Date }
export interface MarketplaceSource { readonly type:string; searchListings(input:SearchListingsInput):Promise<NormalizedListing[]>; getListing(input:{externalListingId:string}):Promise<NormalizedListing>; healthCheck():Promise<SourceHealth> }

export interface FacebookMcpListing { id:unknown; title?:unknown; price?:unknown; location?:unknown; imageUrl?:unknown; sellerName?:unknown; sellerId?:unknown; postedDate?:unknown; url?:unknown; isPending?:unknown; description?:unknown; condition?:unknown; images?:unknown }
const parsePrice=(value:unknown)=>{if(typeof value==="number")return value;if(typeof value!=="string")return undefined;const parsed=Number(value.replace(/[^0-9.-]/g,""));return Number.isFinite(parsed)&&parsed>=0?parsed:undefined};
export function normalizeFacebookListing(raw:FacebookMcpListing):NormalizedListing {
  if(typeof raw.id!=="string"&&typeof raw.id!=="number") throw new Error("Facebook listing is missing a valid id");
  const id=String(raw.id), defaultUrl=`https://www.facebook.com/marketplace/item/${id}/`;
  return normalizedListingSchema.parse({sourceType:"facebook_marketplace",externalListingId:id,listingUrl:typeof raw.url==="string"&&raw.url.startsWith("http")?raw.url:defaultUrl,sellerExternalId:typeof raw.sellerId==="string"?raw.sellerId:undefined,sellerDisplayName:typeof raw.sellerName==="string"&&raw.sellerName!=="Unknown"?raw.sellerName:undefined,title:typeof raw.title==="string"?raw.title:"",description:typeof raw.description==="string"?raw.description:undefined,price:parsePrice(raw.price),currency:"CAD",condition:typeof raw.condition==="string"?raw.condition:undefined,locationText:typeof raw.location==="string"?raw.location:undefined,imageUrls:Array.isArray(raw.images)?raw.images.filter((v):v is string=>typeof v==="string"&&v.startsWith("http")):(typeof raw.imageUrl==="string"&&raw.imageUrl.startsWith("http")?[raw.imageUrl]:[]),publishedAt:typeof raw.postedDate==="string"&&raw.postedDate?raw.postedDate:undefined,status:raw.isPending===true?"pending":"active",rawSourcePayload:raw});
}

export interface McpTransport { callTool(name:string,args:Record<string,unknown>):Promise<unknown> }

type JsonRpcResponse={jsonrpc:"2.0";id:number;result?:{content?:Array<{type:string;text?:string}>;structuredContent?:unknown;isError?:boolean};error?:{code:number;message:string}};
export class StdioMcpTransport implements McpTransport {
  private child:ChildProcessWithoutNullStreams|undefined;private requestId=0;private pending=new Map<number,{resolve:(value:unknown)=>void;reject:(reason:Error)=>void;timer:NodeJS.Timeout}>();private initialized=false;
  constructor(private readonly command:string,private readonly args:readonly string[],private readonly timeoutMs=90_000){}
  private async start(){if(this.child)return;this.child=spawn(this.command,[...this.args],{stdio:["pipe","pipe","pipe"],env:{...process.env}});this.child.stderr.on("data",(chunk)=>process.stderr.write(chunk));this.child.on("exit",()=>{for(const item of this.pending.values()){clearTimeout(item.timer);item.reject(new Error("Facebook MCP process exited"))}this.pending.clear();this.child=undefined;this.initialized=false});const lines=createInterface({input:this.child.stdout});lines.on("line",(line)=>{if(!line.trim())return;try{const message=JSON.parse(line) as JsonRpcResponse;if(typeof message.id!=="number")return;const pending=this.pending.get(message.id);if(!pending)return;clearTimeout(pending.timer);this.pending.delete(message.id);if(message.error)pending.reject(new Error(`MCP ${message.error.code}: ${message.error.message}`));else pending.resolve(message.result)}catch{/* MCP logs are ignored; stderr is forwarded. */}});await this.request("initialize",{protocolVersion:"2025-03-26",capabilities:{},clientInfo:{name:"marketplace-engine",version:"0.1.0"}});this.child.stdin.write(`${JSON.stringify({jsonrpc:"2.0",method:"notifications/initialized"})}\n`);this.initialized=true;}
  private request(method:string,params:Record<string,unknown>){const id=++this.requestId;return new Promise<unknown>((resolve,reject)=>{const timer=setTimeout(()=>{this.pending.delete(id);reject(new Error(`MCP request timed out after ${this.timeoutMs}ms`))},this.timeoutMs);this.pending.set(id,{resolve,reject,timer});this.child!.stdin.write(`${JSON.stringify({jsonrpc:"2.0",id,method,params})}\n`)});}
  async callTool(name:string,args:Record<string,unknown>){await this.start();if(!this.initialized)throw new Error("MCP initialization failed");const result=await this.request("tools/call",{name,arguments:args}) as JsonRpcResponse["result"];if(result?.structuredContent)return result.structuredContent;const text=result?.content?.filter((item)=>item.type==="text").map((item)=>item.text??"").join("\n")??"";if(result?.isError)throw new Error(text||`MCP tool ${name} failed`);if(name==="search_listings")return parseFacebookSearchText(text);if(name==="get_listing")return parseFacebookDetailText(text,args.listing_id);return text;}
  close(){this.child?.kill("SIGTERM")}
}

export function parseFacebookSearchText(text:string):FacebookMcpListing[]{
  if(/No listings found/i.test(text))return [];const blocks=text.split(/\n\s*\n/);const listings:FacebookMcpListing[]=[];
  for(const block of blocks){const heading=block.match(/^\s*\d+\.\s+\*\*(.+?)\*\*\s+—\s+(.+)$/m),url=block.match(/https:\/\/www\.facebook\.com\/marketplace\/item\/(\d+)\/?/);if(!heading||!url)continue;const meta=block.match(/📍\s*(.*?)\s*\|\s*👤\s*(.*?)(?:\s*⏳\s*PENDING)?\s*$/m);listings.push({id:url[1]!,title:heading[1]!,price:heading[2]!.trim(),location:meta?.[1]?.trim(),sellerName:meta?.[2]?.trim(),url:url[0],isPending:/PENDING/.test(block)});}return listings;
}
export function parseFacebookDetailText(text:string,id:unknown):FacebookMcpListing {
  const title=text.match(/^#\s+(.+)$/m)?.[1]??"",price=text.match(/^\*\*Price:\*\*\s*(.+)$/m)?.[1],location=text.match(/^\*\*Location:\*\*\s*(.+)$/m)?.[1],sellerName=text.match(/^\*\*Seller:\*\*\s*(.+)$/m)?.[1],description=text.match(/## Description\n([\s\S]*?)(?=\n\*\*Seller:|$)/)?.[1]?.trim(),condition=text.match(/^\*\*Condition:\*\*\s*(.+)$/m)?.[1];const images=[...text.matchAll(/^\s*\d+\.\s+(https?:\/\/\S+)$/gm)].map((match)=>match[1]!);return {id:String(id),title,price,location,sellerName,description,condition,images,url:text.match(/https:\/\/www\.facebook\.com\/marketplace\/item\/\d+\/?/)?.[0],isPending:/\*\*Status:\*\*.*Pending/i.test(text)};
}
export class FacebookMarketplaceAdapter implements MarketplaceSource {
  readonly type="facebook_marketplace";
  constructor(private readonly transport:McpTransport){}
  async searchListings(input:SearchListingsInput){const raw=await this.transport.callTool("search_listings",{query:input.query,latitude:input.point.latitude,longitude:input.point.longitude,radius_km:input.point.radiusKm,min_price:input.minPrice,max_price:input.maxPrice,category:input.category,limit:input.limit??20});if(!Array.isArray(raw))throw new Error("Facebook MCP transport must return structured listing data");return raw.map((item)=>normalizeFacebookListing(item as FacebookMcpListing));}
  async getListing(input:{externalListingId:string}){return normalizeFacebookListing(await this.transport.callTool("get_listing",{listing_id:input.externalListingId}) as FacebookMcpListing)}
  async healthCheck():Promise<SourceHealth>{try{await this.transport.callTool("search_location",{query:"Windsor, Ontario"});return {status:"healthy",checkedAt:new Date()}}catch(error){const message=error instanceof Error?error.message:String(error);return {status:/cookie|session|login|401|403/i.test(message)?"auth_required":/graphql|doc.?id/i.test(message)?"degraded":"unavailable",message,checkedAt:new Date()}}}
}
export * from "./kijiji.js";
