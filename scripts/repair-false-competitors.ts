import "dotenv/config";
import {Prisma, TaskStatus, TaskType} from "@prisma/client";
import {prisma} from "@marketplace-engine/database/node";
import {classifyDeterministically,draftMessage,isCompetitorAdvertisement,scoreOpportunity} from "@marketplace-engine/intelligence";
import type {NormalizedListing} from "@marketplace-engine/shared";

const json=(value:unknown)=>JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

async function main(){
  const rows=await prisma.opportunity.findMany({
    where:{opportunityType:"competitor"},
    include:{listing:{include:{source:true,seller:true}},territory:{include:{region:{include:{launchConfiguration:true}}}},tasks:true},
  });
  let retainedCompetitors=0,reclassified=0,tasksRestored=0;
  const types:Record<string,number>={};
  for(const row of rows){
    const stored=row.listing;
    if(isCompetitorAdvertisement(stored)){retainedCompetitors++;continue}
    const listing:NormalizedListing={
      sourceType:stored.source.type.toLowerCase(),externalListingId:stored.externalListingId,listingUrl:stored.listingUrl,
      ...(stored.seller?.externalSellerId?{sellerExternalId:stored.seller.externalSellerId}:{}),
      ...(stored.sellerDisplayName?{sellerDisplayName:stored.sellerDisplayName}:{}),title:stored.title,
      ...(stored.description?{description:stored.description}:{}),...(stored.price?{price:Number(stored.price)}:{}),
      currency:stored.currency,...(stored.category?{category:stored.category}:{}),...(stored.condition?{condition:stored.condition}:{}),
      ...(stored.locationText?{locationText:stored.locationText}:{}),...(stored.latitude!=null?{latitude:stored.latitude}:{}),
      ...(stored.longitude!=null?{longitude:stored.longitude}:{}),
      imageUrls:Array.isArray(stored.imageUrls)?stored.imageUrls.filter((value):value is string=>typeof value==="string"):[],
      ...(stored.publicContactPhone?{publicContactPhone:stored.publicContactPhone}:{}),
      ...(stored.publishedAt?{publishedAt:stored.publishedAt}:{}),status:stored.status.toLowerCase() as NormalizedListing["status"],
      rawSourcePayload:stored.rawSourcePayload,
    };
    const classification=classifyDeterministically(listing);
    if(classification.opportunityType==="competitor"){retainedCompetitors++;continue}
    const score=scoreOpportunity({listing,classification,inActiveTerritory:row.territory.region.launchConfiguration?.outreachEnabled===true});
    await prisma.opportunity.update({where:{id:row.id},data:{
      opportunityType:classification.opportunityType,intentCategory:classification.intentCategory,confidence:classification.confidence,
      opportunityScore:score.score,urgencyScore:classification.urgency,estimatedServiceType:classification.opportunityType,
      estimatedJobSize:classification.estimatedJobSize,reasoningSummary:classification.reasoningSummary,
      positiveSignals:json(classification.positiveSignals),negativeSignals:json(classification.negativeSignals),
      scoreExplanation:json(score.explanation),recommendedAction:classification.recommendedAction,
      qualificationStatus:classification.recommendedAction==="skip"?"DISQUALIFIED":"UNREVIEWED",
    }});
    reclassified++;types[classification.opportunityType]=(types[classification.opportunityType]??0)+1;
    const launch=row.territory.region.launchConfiguration;
    if(classification.recommendedAction==="skip"||score.score<(launch?.minimumOpportunityScore??70)||launch?.outreachEnabled!==true||stored.status!=="ACTIVE")continue;
    const alreadyContacted=Boolean(stored.seller&&(stored.seller.previousOutreachCount>0||stored.seller.lastOutreachAt));
    const activeSellerTask=await prisma.outreachTask.findFirst({where:{
      status:{in:[TaskStatus.READY,TaskStatus.SNOOZED,TaskStatus.SENT]},
      opportunity:{listing:stored.sellerId?{sellerId:stored.sellerId}:{sourceId:stored.sourceId,sellerDisplayName:{equals:stored.sellerDisplayName??"",mode:"insensitive"}}},
      NOT:{opportunityId:row.id},
    }});
    if(alreadyContacted||activeSellerTask)continue;
    const existingActive=row.tasks.find(task=>task.status==="READY"||task.status==="SNOOZED");
    if(existingActive)continue;
    await prisma.outreachTask.create({data:{
      opportunityId:row.id,taskType:TaskType.INITIAL_OUTREACH,assignedRepId:row.assignedRepId,status:TaskStatus.READY,
      priority:score.score,suggestedMessage:draftMessage(listing,classification,"",launch?.outreachBrandName),dueAt:new Date(),followUpEligibility:true,
    }});
    tasksRestored++;
  }
  console.log(JSON.stringify({examined:rows.length,retainedCompetitors,reclassified,tasksRestored,types},null,2));
}

main().finally(()=>prisma.$disconnect());
