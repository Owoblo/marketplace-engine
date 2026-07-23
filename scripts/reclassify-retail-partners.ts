import "dotenv/config";
import {prisma} from "@marketplace-engine/database/node";
import {classifyDeterministically,draftMessage,isRetailInventoryListing} from "@marketplace-engine/intelligence";
import type {NormalizedListing} from "@marketplace-engine/shared";

const normalizedKey=(sourceId:string,sellerId:string|null,sellerDisplayName:string|null,listingId:string)=>sellerId?`${sourceId}:seller:${sellerId}`:sellerDisplayName?`${sourceId}:name:${sellerDisplayName.normalize("NFKC").trim().replace(/\s+/g," ").toLocaleLowerCase("en-CA")}`:`${sourceId}:listing:${listingId}`;

async function main(){
  const listings=await prisma.listing.findMany({where:{status:"ACTIVE"},include:{opportunities:{include:{territory:{include:{region:{include:{launchConfiguration:true}}}},tasks:{orderBy:{createdAt:"asc"}}}}}});
  const retail=listings.filter(isRetailInventoryListing),groups=new Map<string,typeof retail>();
  for(const listing of retail){const key=normalizedKey(listing.sourceId,listing.sellerId,listing.sellerDisplayName,listing.id),group=groups.get(key)??[];group.push(listing);groups.set(key,group)}
  let opportunities=0,cancelledTasks=0,retainedTasks=0;
  for(const group of groups.values()){
    const opportunityRows=group.flatMap(listing=>listing.opportunities.map(opportunity=>({listing,opportunity})));if(!opportunityRows.length)continue;
    const sentExists=opportunityRows.some(({opportunity})=>opportunity.tasks.some(task=>task.status==="SENT"));
    const retained=sentExists?null:opportunityRows.flatMap(({listing,opportunity})=>opportunity.tasks.filter(task=>task.status==="READY"||task.status==="SNOOZED").map(task=>({listing,opportunity,task}))).sort((a,b)=>b.task.priority-a.task.priority||a.task.createdAt.getTime()-b.task.createdAt.getTime())[0];
    for(const {listing,opportunity} of opportunityRows){
      const normalized:NormalizedListing={sourceType:"stored",externalListingId:listing.externalListingId,listingUrl:listing.listingUrl,...(listing.sellerExternalId?{sellerExternalId:listing.sellerExternalId}:{}),...(listing.sellerDisplayName?{sellerDisplayName:listing.sellerDisplayName}:{}),title:listing.title,...(listing.description?{description:listing.description}:{}),...(listing.price?{price:Number(listing.price)}:{}),currency:listing.currency,...(listing.category?{category:listing.category}:{}),...(listing.condition?{condition:listing.condition}:{}),...(listing.locationText?{locationText:listing.locationText}:{}),imageUrls:Array.isArray(listing.imageUrls)?listing.imageUrls.filter((value):value is string=>typeof value==="string"):[],...(listing.publicContactPhone?{publicContactPhone:listing.publicContactPhone}:{}),...(listing.publishedAt?{publishedAt:listing.publishedAt}:{}),status:"active",rawSourcePayload:listing.rawSourcePayload};
      const classification=classifyDeterministically(normalized);await prisma.opportunity.update({where:{id:opportunity.id},data:{opportunityType:"retail_delivery_partner",intentCategory:"item_delivery",confidence:classification.confidence,urgencyScore:classification.urgency,estimatedServiceType:"retail_delivery_partner",estimatedJobSize:"large",reasoningSummary:classification.reasoningSummary,positiveSignals:classification.positiveSignals,negativeSignals:classification.negativeSignals,recommendedAction:"contact_later"}});opportunities++;
      for(const task of opportunity.tasks.filter(task=>task.status==="READY"||task.status==="SNOOZED")){
        if(retained?.task.id===task.id){const brand=opportunity.territory.region.launchConfiguration?.outreachBrandName??"Saturn Star Movers";await prisma.outreachTask.update({where:{id:task.id},data:{status:"READY",suggestedMessage:draftMessage(normalized,classification,"",brand),finalMessage:null,followUpEligibility:false}});retainedTasks++;}
        else {await prisma.outreachTask.update({where:{id:task.id},data:{status:"CANCELLED",completedAt:new Date(),followUpEligibility:false,skipReason:"duplicate_retail_partnership"}});cancelledTasks++;}
      }
    }
  }
  console.log(JSON.stringify({retailListings:retail.length,retailSellerGroups:groups.size,opportunities,cancelledTasks,retainedTasks}));
}
main().finally(()=>prisma.$disconnect());
