import {Prisma,TaskStatus,TaskType,prisma} from "@marketplace-engine/database";
import {TaskCard,type QueueTask} from "./task-card";
export const dynamic="force-dynamic";

type QueueSearch={territory?:string;minScore?:string;type?:string};
const opportunityTypes=["residential_move","furniture_delivery","appliance_delivery","rental_move","office_move","packing","junk_removal","labour_only","equipment_purchase"] as const;

export default async function Queue({searchParams}:{searchParams:Promise<QueueSearch>}){
  const params=await searchParams;
  const minimumScore=Math.max(0,Math.min(100,Number(params.minScore??70)||70));
  const opportunityType=opportunityTypes.find(type=>type===params.type);
  const statusFilter:Prisma.OutreachTaskWhereInput={OR:[{status:{in:[TaskStatus.READY,TaskStatus.SNOOZED]},OR:[{snoozedUntil:null},{snoozedUntil:{lte:new Date()}}]},{status:TaskStatus.SENT,taskType:TaskType.INITIAL_OUTREACH,result:null}]};
  const where:Prisma.OutreachTaskWhereInput={AND:[statusFilter,{opportunity:{opportunityScore:{gte:minimumScore},...(params.territory?{territoryId:params.territory}:{}),...(opportunityType?{opportunityType}:{})}}]};
  const [rows,matchingCount,territories]=await Promise.all([
    prisma.outreachTask.findMany({where,include:{opportunity:{include:{listing:true,territory:true,contacts:true}},assignedRep:true},orderBy:[{priority:"desc"},{dueAt:"asc"}],take:200}),
    prisma.outreachTask.count({where}),
    prisma.territory.findMany({where:{enabled:true},orderBy:{name:"asc"},select:{id:true,name:true}}),
  ]);
  const tasks:QueueTask[]=rows.map(row=>({id:row.id,title:row.opportunity.listing.title,seller:row.opportunity.listing.sellerDisplayName??"Seller unavailable",city:row.opportunity.listing.locationText??row.opportunity.territory.primaryCity,score:row.opportunity.opportunityScore,message:row.finalMessage??row.suggestedMessage,url:row.opportunity.listing.listingUrl,conversationUrl:row.conversationUrl,explanation:Array.isArray(row.opportunity.scoreExplanation)?row.opportunity.scoreExplanation.filter((v):v is string=>typeof v==="string"):[],history:row.opportunity.contacts.map(c=>`${c.sentAt.toLocaleDateString("en-CA")}: ${c.responseStatus??"sent"}`),taskType:row.taskType,status:row.status}));
  const ready=tasks.filter(task=>task.status!=="SENT"),awaiting=tasks.filter(task=>task.status==="SENT");
  return <><header><div><p className="eyebrow">MANUAL OUTREACH</p><h1>Outreach workspace</h1><p>{tasks.length}{matchingCount>tasks.length?` displayed of ${matchingCount}`:""} matching tasks · {ready.length} ready · {awaiting.length} awaiting reply. Every Facebook message remains manual.</p></div></header><form className="filters" method="get"><select name="territory" defaultValue={params.territory??""}><option value="">All assigned territories</option>{territories.map(territory=><option value={territory.id} key={territory.id}>{territory.name}</option>)}</select><select name="minScore" defaultValue={String(minimumScore)}><option value="85">Score 85+</option><option value="70">Score 70+</option><option value="50">Score 50+</option><option value="0">All scores</option></select><select name="type" defaultValue={opportunityType??""}><option value="">All types</option>{opportunityTypes.map(type=><option value={type} key={type}>{type.replaceAll("_"," ")}</option>)}</select><button type="submit">Apply filters</button><a className="button" href="/outreach">Reset</a></form><h2>Ready to send and follow up</h2>{ready.length?ready.map(task=><TaskCard task={task} key={task.id}/>):<section className="panel empty"><span>★</span><h2>The send queue is clear</h2></section>}<h2 className="sectionTitle">Awaiting reply</h2>{awaiting.length?awaiting.map(task=><TaskCard task={task} key={task.id}/>):<section className="panel empty"><p>No conversations are awaiting an outcome.</p></section>}</>;
}
