import "dotenv/config";
import {PrismaClient} from "@prisma/client";
import {isCompetitorAdvertisement} from "@marketplace-engine/intelligence";

const db=new PrismaClient();
const normalizeName=(value:string|null)=>value?.trim().toLowerCase().replace(/\s+/g," ");

async function main(){
  const active=await db.outreachTask.findMany({where:{status:{in:["READY","SNOOZED"]}},include:{opportunity:{include:{listing:true}}},orderBy:[{priority:"desc"},{createdAt:"asc"}]});
  const seen=new Set<string>(),duplicateTaskIds:string[]=[];
  for(const task of active){const listing=task.opportunity.listing,name=normalizeName(listing.sellerDisplayName),key=listing.sellerId?`id:${listing.sellerId}`:name?`name:${listing.sourceId}:${name}`:`listing:${listing.id}`;if(seen.has(key))duplicateTaskIds.push(task.id);else seen.add(key)}
  if(duplicateTaskIds.length)await db.outreachTask.updateMany({where:{id:{in:duplicateTaskIds}},data:{status:"CANCELLED",skipReason:"Duplicate seller outreach task",followUpEligibility:false,completedAt:new Date()}});

  const opportunities=await db.opportunity.findMany({where:{opportunityType:{not:"competitor"}},include:{listing:true}}),competitorIds:string[]=[];
  for(const opportunity of opportunities){const listing=opportunity.listing;if(isCompetitorAdvertisement({sourceType:"facebook_marketplace",externalListingId:listing.externalListingId,listingUrl:listing.listingUrl,title:listing.title,description:listing.description??undefined,price:listing.price?Number(listing.price):undefined,currency:listing.currency,category:listing.category??undefined,condition:listing.condition??undefined,locationText:listing.locationText??undefined,latitude:listing.latitude??undefined,longitude:listing.longitude??undefined,imageUrls:Array.isArray(listing.imageUrls)?listing.imageUrls.filter((value):value is string=>typeof value==="string"):[],publishedAt:listing.publishedAt??undefined,status:listing.status.toLowerCase() as "active"|"pending"|"sold"|"removed"|"unknown",rawSourcePayload:listing.rawSourcePayload}))competitorIds.push(opportunity.id)}
  if(competitorIds.length){await db.opportunity.updateMany({where:{id:{in:competitorIds}},data:{opportunityType:"competitor",intentCategory:"none",opportunityScore:0,recommendedAction:"skip",reasoningSummary:"Moving-service advertisement classified as competitor intelligence."}});await db.outreachTask.updateMany({where:{opportunityId:{in:competitorIds},status:{in:["READY","SNOOZED"]}},data:{status:"CANCELLED",skipReason:"Competitor advertisement",followUpEligibility:false,completedAt:new Date()}})}

  const cutoff=new Date(Date.now()-7*86400000),stale=await db.opportunity.findMany({where:{listing:{publishedAt:{lt:cutoff}}},select:{id:true}}),staleIds=stale.map(item=>item.id);const staleCancelled=staleIds.length?await db.outreachTask.updateMany({where:{opportunityId:{in:staleIds},status:{in:["READY","SNOOZED"]}},data:{status:"CANCELLED",skipReason:"Listing older than seven-day outreach window",followUpEligibility:false,completedAt:new Date()}}):{count:0};
  await db.auditEvent.create({data:{eventType:"outreach_queue_hygiene",entityType:"OutreachTask",payload:{duplicateSellerTasksCancelled:duplicateTaskIds.length,competitorsSeparated:competitorIds.length,staleTasksCancelled:staleCancelled.count}}});
  console.log(JSON.stringify({duplicateSellerTasksCancelled:duplicateTaskIds.length,competitorsSeparated:competitorIds.length,staleTasksCancelled:staleCancelled.count},null,2));
}

main().finally(()=>db.$disconnect());
