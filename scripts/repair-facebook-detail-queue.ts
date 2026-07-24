import "dotenv/config";
import {PgBoss} from "pg-boss";
import {prisma} from "@marketplace-engine/database/node";

const DETAIL="listing-detail";
const APPLY=process.argv.includes("--apply");
const MAX_AGE_DAYS=7;
const CHUNK_SIZE=500;

type QueuedDetailJob={
  id:string;
  data:{searchDefinitionId?:string;externalListingId?:string};
  created_on:Date;
};

function chunks<T>(items:readonly T[],size:number):T[][] {
  const result:T[][]=[];
  for(let index=0;index<items.length;index+=size)result.push(items.slice(index,index+size));
  return result;
}

function priorityFor(firstObservedAt:Date,now:Date):number {
  const ageHours=(now.getTime()-firstObservedAt.getTime())/3_600_000;
  if(ageHours<=24)return 100;
  if(ageHours<=48)return 50;
  return 10;
}

async function main(){
  const now=new Date(),cutoff=new Date(now.getTime()-MAX_AGE_DAYS*86_400_000);
  const source=await prisma.source.findUniqueOrThrow({where:{type:"facebook_marketplace"},select:{id:true}});
  const pending=await prisma.$queryRawUnsafe<QueuedDetailJob[]>(
    `select id::text,data,created_on from marketplace_jobs.job where name=$1 and state='created' order by created_on asc`,
    DETAIL,
  );
  const firstJobByListing=new Map<string,QueuedDetailJob>();
  for(const job of pending){
    const externalListingId=job.data?.externalListingId;
    if(externalListingId&&!firstJobByListing.has(externalListingId))firstJobByListing.set(externalListingId,job);
  }
  const listingIds=[...firstJobByListing.keys()];
  const eligible=new Map<string,{firstObservedAt:Date}>();
  for(const batch of chunks(listingIds,CHUNK_SIZE)){
    const listings=await prisma.listing.findMany({
      where:{
        sourceId:source.id,
        externalListingId:{in:batch},
        firstObservedAt:{gte:cutoff},
        status:{in:["ACTIVE","PENDING"]},
        opportunities:{none:{}},
        NOT:{locationText:{contains:"Michigan",mode:"insensitive"}},
      },
      select:{externalListingId:true,firstObservedAt:true,locationText:true},
    });
    for(const listing of listings){
      if(listing.locationText&&/\bMI\b/i.test(listing.locationText))continue;
      eligible.set(listing.externalListingId,{firstObservedAt:listing.firstObservedAt});
    }
  }
  const keep=[...eligible.entries()].map(([externalListingId,listing])=>({
    job:firstJobByListing.get(externalListingId)!,
    externalListingId,
    priority:priorityFor(listing.firstObservedAt,now),
  })).sort((a,b)=>b.priority-a.priority||a.job.created_on.getTime()-b.job.created_on.getTime());
  const report={
    apply:APPLY,
    pendingJobs:pending.length,
    uniquePendingListings:firstJobByListing.size,
    eligibleUniqueListings:keep.length,
    redundantOrObsoleteJobs:pending.length-keep.length,
    priorities:keep.reduce<Record<string,number>>((counts,item)=>{counts[item.priority]=(counts[item.priority]??0)+1;return counts},{}),
  };
  console.log(JSON.stringify(report,null,2));
  if(!APPLY)return;

  const databaseUrl=process.env.DIRECT_URL??process.env.DATABASE_URL;
  if(!databaseUrl)throw new Error("DIRECT_URL or DATABASE_URL is required");
  const queueDatabaseUrl=databaseUrl.replace(/([?&])sslmode=require(&|$)/,(_match,prefix:string,suffix:string)=>suffix?prefix:"");
  const boss=new PgBoss({connectionString:queueDatabaseUrl,ssl:{rejectUnauthorized:false},schema:"marketplace_jobs",application_name:"marketplace-engine-queue-repair"});
  await boss.start();
  for(const batch of chunks(pending.map(job=>job.id),CHUNK_SIZE))await boss.cancel(DETAIL,batch);
  for(const item of keep){
    const searchDefinitionId=item.job.data.searchDefinitionId;
    if(!searchDefinitionId)continue;
    await boss.send(DETAIL,{searchDefinitionId,externalListingId:item.externalListingId},{
      singletonKey:`${source.id}:${item.externalListingId}`,
      priority:item.priority,
      retryLimit:5,
      retryDelay:90,
      retryBackoff:true,
      retryDelayMax:3600,
      expireInSeconds:1800,
    });
  }
  await boss.stop({graceful:true,timeout:30_000});
  console.log(JSON.stringify({requeued:keep.length,cancelled:pending.length},null,2));
}

main().finally(()=>prisma.$disconnect());
