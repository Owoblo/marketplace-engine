import "dotenv/config";
import { ListingStatus, Prisma, TaskStatus, TaskType } from "@prisma/client";
import { prisma } from "@marketplace-engine/database/node";
import {
  createListingClassifier,
  DEFAULT_SCORING_WEIGHTS,
  draftMessage,
  scoreOpportunity,
} from "@marketplace-engine/intelligence";
import { evaluateInitialOutreach } from "@marketplace-engine/operations";
import { normalizedListingSchema } from "@marketplace-engine/shared";

const json=(value:unknown)=>JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
const sourceFilter=process.env.RECLASSIFY_SOURCE?.trim();
const limit=Number.parseInt(process.env.RECLASSIFY_LIMIT??"",10);
const dryRun=process.env.RECLASSIFY_DRY_RUN==="1";
const phone=process.env.SATURN_STAR_PHONE??"";
const classifier=createListingClassifier({
  apiKey:process.env.OPENAI_API_KEY,
  model:process.env.OPENAI_MODEL,
});
const listingStatus={
  [ListingStatus.ACTIVE]:"active",
  [ListingStatus.PENDING]:"pending",
  [ListingStatus.SOLD]:"sold",
  [ListingStatus.REMOVED]:"removed",
  [ListingStatus.UNKNOWN]:"unknown",
} as const;

async function main(){
  const scoringConfig=await prisma.scoringConfiguration.findFirst({where:{enabled:true},orderBy:{version:"desc"}});
  const weights:Record<keyof typeof DEFAULT_SCORING_WEIGHTS,number>={...DEFAULT_SCORING_WEIGHTS};
  if(scoringConfig?.weights&&typeof scoringConfig.weights==="object"&&!Array.isArray(scoringConfig.weights)){
    for(const key of Object.keys(weights) as Array<keyof typeof weights>){
      const value=(scoringConfig.weights as Record<string,unknown>)[key];
      if(typeof value==="number"&&Number.isFinite(value))weights[key]=value;
    }
  }
  const opportunities=await prisma.opportunity.findMany({
    where:{
      listing:{status:{in:[ListingStatus.ACTIVE,ListingStatus.PENDING,ListingStatus.UNKNOWN]},...(sourceFilter?{source:{type:sourceFilter}}:{})},
    },
    include:{
      listing:{include:{source:true,seller:true,suppressions:true}},
      territory:{include:{region:{include:{launchConfiguration:true}}}},
      tasks:true,
    },
    orderBy:{createdAt:"asc"},
    ...(Number.isFinite(limit)&&limit>0?{take:limit}:{}),
  });
  const summary={examined:0,qualified:0,review:0,competitors:0,retailers:0,irrelevant:0,cancelledTasks:0,restoredTasks:0,unchangedSent:0,errors:0};
  for(const opportunity of opportunities){
    try{
      const stored=opportunity.listing;
      const imageUrls=Array.isArray(stored.imageUrls)?stored.imageUrls.filter((value):value is string=>typeof value==="string"&&/^https?:\/\//.test(value)):[];
      const listing=normalizedListingSchema.parse({
        sourceType:stored.source.type,
        externalListingId:stored.externalListingId,
        listingUrl:stored.listingUrl,
        ...(stored.seller?.externalSellerId?{sellerExternalId:stored.seller.externalSellerId}:{}),
        ...(stored.sellerDisplayName?{sellerDisplayName:stored.sellerDisplayName}:{}),
        title:stored.title,
        ...(stored.description?{description:stored.description}:{}),
        ...(stored.price!=null?{price:Number(stored.price)}:{}),
        currency:stored.currency,
        ...(stored.category?{category:stored.category}:{}),
        ...(stored.condition?{condition:stored.condition}:{}),
        ...(stored.locationText?{locationText:stored.locationText}:{}),
        ...(stored.latitude!=null?{latitude:stored.latitude}:{}),
        ...(stored.longitude!=null?{longitude:stored.longitude}:{}),
        imageUrls,
        ...(stored.publicContactPhone?{publicContactPhone:stored.publicContactPhone}:{}),
        ...(stored.publishedAt?{publishedAt:stored.publishedAt}:{}),
        status:listingStatus[stored.status],
        rawSourcePayload:stored.rawSourcePayload,
      });
      const classification=await classifier(listing);
      const previousContactCount=await prisma.contactAttempt.count({where:{opportunityId:opportunity.id}});
      const now=new Date();
      const suppressed=stored.seller?.suppressionStatus===true||stored.suppressions.some(item=>item.permanent||Boolean(item.expiresAt&&item.expiresAt>now));
      const launch=opportunity.territory.region.launchConfiguration;
      const score=scoreOpportunity({listing,classification,inActiveTerritory:launch?.outreachEnabled===true,previousContactCount,suppressed,now},weights);
      const disqualified=["competitor","irrelevant"].includes(classification.opportunityType)||classification.recommendedAction==="skip";
      const needsReview=!disqualified&&(classification.recommendedAction==="monitor"||classification.confidence<.68);
      const qualificationStatus=disqualified?"DISQUALIFIED":needsReview?"UNREVIEWED":"QUALIFIED";
      summary.examined++;
      if(classification.opportunityType==="competitor")summary.competitors++;
      else if(classification.opportunityType==="retail_delivery_partner")summary.retailers++;
      else if(classification.opportunityType==="irrelevant")summary.irrelevant++;
      else if(needsReview)summary.review++;
      else summary.qualified++;
      if(dryRun){
        console.log(JSON.stringify({id:stored.id,title:stored.title,type:classification.opportunityType,confidence:classification.confidence,action:classification.recommendedAction,score:score.score}));
        continue;
      }
      await prisma.opportunity.update({where:{id:opportunity.id},data:{
        opportunityType:classification.opportunityType,
        intentCategory:classification.intentCategory,
        confidence:classification.confidence,
        opportunityScore:score.score,
        urgencyScore:classification.urgency,
        estimatedServiceType:classification.opportunityType,
        estimatedJobSize:classification.estimatedJobSize,
        reasoningSummary:classification.reasoningSummary,
        positiveSignals:json(classification.positiveSignals),
        negativeSignals:json(classification.negativeSignals),
        scoreExplanation:json(score.explanation),
        recommendedAction:classification.recommendedAction,
        qualificationStatus,
      }});
      if(disqualified||needsReview){
        const cancelled=await prisma.outreachTask.updateMany({
          where:{opportunityId:opportunity.id,status:{in:[TaskStatus.READY,TaskStatus.SNOOZED]}},
          data:{status:TaskStatus.CANCELLED,completedAt:now,followUpEligibility:false,skipReason:disqualified?classification.opportunityType==="competitor"?"competitor_advertisement":"irrelevant_after_multimodal_review":"classification_needs_review"},
        });
        summary.cancelledTasks+=cancelled.count;
        continue;
      }
      if(opportunity.tasks.some(task=>task.status===TaskStatus.SENT)){summary.unchangedSent++;continue;}
      const activeTask=await prisma.outreachTask.findFirst({where:{opportunityId:opportunity.id,status:{in:[TaskStatus.READY,TaskStatus.SNOOZED]}}});
      const activeSellerTask=stored.sellerId?await prisma.outreachTask.findFirst({where:{
        status:{in:[TaskStatus.READY,TaskStatus.SNOOZED]},
        opportunity:{listing:{sellerId:stored.sellerId}},
        NOT:{opportunityId:opportunity.id},
      }}):null;
      const listingSuppressed=stored.suppressions.some(item=>item.listingId===stored.id&&(item.permanent||Boolean(item.expiresAt&&item.expiresAt>now)));
      const eligibility=evaluateInitialOutreach({
        listingStatus:listing.status,
        score:score.score,
        minimumScore:launch?.minimumOpportunityScore??70,
        outreachEnabled:launch?.outreachEnabled===true,
        sellerSuppressed:suppressed,
        listingSuppressed,
        activeTaskExists:Boolean(activeTask||activeSellerTask),
        ...(stored.seller?.lastOutreachAt?{sellerLastContactAt:stored.seller.lastOutreachAt}:{}),
        sellerContactCount:stored.seller?.previousOutreachCount??previousContactCount,
        maxContactAttempts:classification.opportunityType==="retail_delivery_partner"?1:2,
        cooldownDays:classification.opportunityType==="retail_delivery_partner"?90:30,
        now,
      });
      if(eligibility.allowed&&!activeTask){
        await prisma.outreachTask.create({data:{
          opportunityId:opportunity.id,
          taskType:TaskType.INITIAL_OUTREACH,
          assignedRepId:opportunity.assignedRepId,
          status:TaskStatus.READY,
          priority:score.score,
          suggestedMessage:draftMessage(listing,classification,phone,launch?.outreachBrandName),
          dueAt:now,
          followUpEligibility:true,
        }});
        summary.restoredTasks++;
      }
      await prisma.auditEvent.create({data:{
        sourceId:stored.sourceId,
        eventType:"inventory_multimodal_reclassified",
        entityType:"Opportunity",
        entityId:opportunity.id,
        payload:json({classification,score:score.score,eligibility}),
      }});
    }catch(error){
      summary.errors++;
      console.error(JSON.stringify({opportunityId:opportunity.id,error:error instanceof Error?error.message:String(error)}));
    }
    if(summary.examined%25===0)console.log(JSON.stringify({progress:summary.examined,total:opportunities.length}));
  }
  console.log(JSON.stringify({dryRun,total:opportunities.length,...summary}));
}

main().finally(()=>prisma.$disconnect());
