import {Prisma,TaskStatus,TaskType,prisma} from "@marketplace-engine/database";
import {TaskCard,type QueueTask} from "./task-card";
export const dynamic="force-dynamic";

type QueueSearch={territory?:string;minScore?:string;type?:string;page?:string};
const opportunityTypes=["residential_move","furniture_delivery","appliance_delivery","rental_move","office_move","packing","junk_removal","labour_only","equipment_purchase"] as const;
const PAGE_SIZE=25;

export default async function Queue({searchParams}:{searchParams:Promise<QueueSearch>}){
  const params=await searchParams;
  const minimumScore=Math.max(0,Math.min(100,Number(params.minScore??70)||70));
  const opportunityType=opportunityTypes.find(type=>type===params.type);
  const page=Math.max(1,Math.floor(Number(params.page??1)||1)),skip=(page-1)*PAGE_SIZE;
  const opportunityFilter:Prisma.OutreachTaskWhereInput={opportunity:{opportunityScore:{gte:minimumScore},...(params.territory?{territoryId:params.territory}:{}),...(opportunityType?{opportunityType}:{})}};
  const readyWhere:Prisma.OutreachTaskWhereInput={AND:[opportunityFilter,{status:{in:[TaskStatus.READY,TaskStatus.SNOOZED]},OR:[{snoozedUntil:null},{snoozedUntil:{lte:new Date()}}]}]};
  const awaitingWhere:Prisma.OutreachTaskWhereInput={AND:[opportunityFilter,{status:TaskStatus.SENT,taskType:TaskType.INITIAL_OUTREACH,result:null}]};
  const select={id:true,finalMessage:true,suggestedMessage:true,conversationUrl:true,taskType:true,status:true,opportunity:{select:{opportunityScore:true,scoreExplanation:true,listing:{select:{title:true,sellerDisplayName:true,locationText:true,listingUrl:true}},territory:{select:{primaryCity:true}},contacts:{orderBy:{sentAt:"desc" as const},take:3,select:{sentAt:true,responseStatus:true}}}}} satisfies Prisma.OutreachTaskSelect;
  const [readyRows,awaitingRows,readyCount,awaitingCount,territories]=await Promise.all([
    prisma.outreachTask.findMany({where:readyWhere,select,orderBy:[{priority:"desc"},{dueAt:"asc"}],skip,take:PAGE_SIZE}),
    prisma.outreachTask.findMany({where:awaitingWhere,select,orderBy:{completedAt:"desc"},skip,take:PAGE_SIZE}),
    prisma.outreachTask.count({where:readyWhere}),prisma.outreachTask.count({where:awaitingWhere}),
    prisma.territory.findMany({where:{enabled:true},orderBy:{name:"asc"},select:{id:true,name:true}}),
  ]);
  const mapTask=(row:typeof readyRows[number]):QueueTask=>({id:row.id,title:row.opportunity.listing.title,seller:row.opportunity.listing.sellerDisplayName??"Seller unavailable",city:row.opportunity.listing.locationText??row.opportunity.territory.primaryCity,score:row.opportunity.opportunityScore,message:row.finalMessage??row.suggestedMessage,url:row.opportunity.listing.listingUrl,conversationUrl:row.conversationUrl,explanation:Array.isArray(row.opportunity.scoreExplanation)?row.opportunity.scoreExplanation.filter((v):v is string=>typeof v==="string"):[],history:row.opportunity.contacts.map(c=>`${c.sentAt.toLocaleDateString("en-CA")}: ${c.responseStatus??"sent"}`),taskType:row.taskType,status:row.status});const ready=readyRows.map(mapTask),awaiting=awaitingRows.map(mapTask),matchingCount=readyCount+awaitingCount,totalPages=Math.max(1,Math.ceil(Math.max(readyCount,awaitingCount)/PAGE_SIZE));const pageHref=(target:number)=>{const query=new URLSearchParams();if(params.territory)query.set("territory",params.territory);query.set("minScore",String(minimumScore));if(opportunityType)query.set("type",opportunityType);query.set("page",String(target));return `/outreach?${query}`};
  return <><header><div><p className="eyebrow">MANUAL OUTREACH</p><h1>Outreach workspace</h1><p>{matchingCount} matching tasks · {readyCount} ready · {awaitingCount} awaiting reply. Page {page} of {totalPages}. Every Facebook message remains manual.</p></div></header><form className="filters" method="get"><select name="territory" defaultValue={params.territory??""}><option value="">All assigned territories</option>{territories.map(territory=><option value={territory.id} key={territory.id}>{territory.name}</option>)}</select><select name="minScore" defaultValue={String(minimumScore)}><option value="85">Score 85+</option><option value="70">Score 70+</option><option value="50">Score 50+</option><option value="0">All scores</option></select><select name="type" defaultValue={opportunityType??""}><option value="">All types</option>{opportunityTypes.map(type=><option value={type} key={type}>{type.replaceAll("_"," ")}</option>)}</select><button type="submit">Apply filters</button><a className="button" href="/outreach">Reset</a></form><h2>Ready to send and follow up</h2>{ready.length?ready.map(task=><TaskCard task={task} key={task.id}/>):<section className="panel empty"><span>★</span><h2>The send queue is clear</h2></section>}<h2 className="sectionTitle">Awaiting reply</h2>{awaiting.length?awaiting.map(task=><TaskCard task={task} key={task.id}/>):<section className="panel empty"><p>No conversations are awaiting an outcome.</p></section>}<div className="actions">{page>1&&<a className="button" href={pageHref(page-1)}>← Previous</a>}{page<totalPages&&<a className="button" href={pageHref(page+1)}>Next →</a>}</div></>;
}
