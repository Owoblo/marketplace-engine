import type {PrismaClient} from "@prisma/client";

type MailConfig={apiKey:string;to:string;from:string;dashboardUrl:string;minimumScore:number};

function config():MailConfig|null{
  const apiKey=process.env.RESEND_API_KEY,to=process.env.ALERT_EMAIL_TO;
  if(!apiKey||!to)return null;
  return {apiKey,to,from:process.env.ALERT_EMAIL_FROM??"Saturn Star Marketplace <marketplace@starmovers.ca>",dashboardUrl:(process.env.APP_BASE_URL??"http://localhost:3000").replace(/\/$/,""),minimumScore:Number(process.env.ALERT_MIN_SCORE??85)};
}

const escapeHtml=(value:string)=>value.replace(/[&<>"']/g,character=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[character]!);

async function sendEmail(input:{subject:string;html:string}){
  const mail=config();if(!mail)return false;
  const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${mail.apiKey}`,"Content-Type":"application/json"},body:JSON.stringify({from:mail.from,to:[mail.to],subject:input.subject,html:input.html})});
  if(!response.ok)throw new Error(`Resend delivery failed (${response.status}): ${(await response.text()).slice(0,500)}`);
  return true;
}

export async function sendOpportunityDigest(db:PrismaClient){
  const mail=config();if(!mail)return {sent:false,count:0};
  const candidates=await db.outreachTask.findMany({where:{status:"READY",priority:{gte:mail.minimumScore},NOT:{opportunity:{listing:{listingUrl:{startsWith:"manual:"}}}}},include:{opportunity:{include:{listing:{include:{source:true}},territory:{include:{region:true}}}}},orderBy:[{priority:"desc"},{createdAt:"asc"}],take:25});
  const unalerted=[];for(const task of candidates){if(!await db.auditEvent.findFirst({where:{eventType:"email_opportunity_alert",entityType:"OutreachTask",entityId:task.id}}))unalerted.push(task)}
  if(!unalerted.length)return {sent:false,count:0};
  const rows=unalerted.map(task=>`<li><strong>${task.priority} — ${escapeHtml(task.opportunity.listing.title)}</strong><br>${escapeHtml(task.opportunity.listing.locationText??task.opportunity.territory.primaryCity)} · ${escapeHtml(task.opportunity.opportunityType.replaceAll("_"," "))}<br><a href="${escapeHtml(task.opportunity.listing.listingUrl)}">Open ${escapeHtml(task.opportunity.listing.source.name)} listing</a></li>`).join("");
  await sendEmail({subject:`${unalerted.length} high-priority Marketplace opportunit${unalerted.length===1?"y":"ies"}`,html:`<h2>Saturn Star Marketplace opportunities</h2><p>${unalerted.length} new task${unalerted.length===1?" is":"s are"} ready for human review. No messages were sent automatically.</p><ol>${rows}</ol><p><a href="${mail.dashboardUrl}/outreach?minScore=${mail.minimumScore}">Open outreach queue</a></p>`});
  await db.auditEvent.createMany({data:unalerted.map(task=>({eventType:"email_opportunity_alert",entityType:"OutreachTask",entityId:task.id,payload:{to:mail.to,score:task.priority}}))});
  return {sent:true,count:unalerted.length};
}

export async function sendSourceHealthAlert(db:PrismaClient,input:{status:string;message?:string}){
  const mail=config();if(!mail||input.status==="healthy")return false;
  const since=new Date(Date.now()-6*60*60*1000);const existing=await db.auditEvent.findFirst({where:{eventType:"email_source_health_alert",createdAt:{gte:since},payload:{path:["status"],equals:input.status}}});if(existing)return false;
  await sendEmail({subject:`Marketplace source needs attention: ${input.status.replaceAll("_"," ")}`,html:`<h2>Facebook Marketplace source alert</h2><p>Status: <strong>${escapeHtml(input.status)}</strong></p><p>${escapeHtml(input.message??"The worker reported a source problem.")}</p><p><a href="${mail.dashboardUrl}/health">Open system health</a></p>`});
  await db.auditEvent.create({data:{eventType:"email_source_health_alert",entityType:"Source",payload:{status:input.status,to:mail.to}}});return true;
}

export async function sendDailySummary(db:PrismaClient){
  const mail=config();if(!mail)return false;const date=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Toronto",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
  if(await db.auditEvent.findFirst({where:{eventType:"email_daily_summary",entityId:date}}))return false;
  const since=new Date(Date.now()-24*60*60*1000);const [listings,tasks,sent,replies,leads,followUps]=await Promise.all([db.listing.count({where:{firstObservedAt:{gte:since}}}),db.outreachTask.count({where:{createdAt:{gte:since}}}),db.outreachTask.count({where:{status:"SENT",completedAt:{gte:since}}}),db.contactAttempt.count({where:{responseAt:{gte:since}}}),db.lead.count({where:{createdAt:{gte:since}}}),db.outreachTask.count({where:{taskType:"FOLLOW_UP",status:"READY"}})]);
  await sendEmail({subject:`Saturn Star Marketplace daily summary — ${date}`,html:`<h2>Marketplace activity</h2><ul><li>${listings} new listings</li><li>${tasks} outreach tasks created</li><li>${sent} messages marked sent</li><li>${replies} replies recorded</li><li>${leads} leads created</li><li>${followUps} follow-ups ready</li></ul><p><a href="${mail.dashboardUrl}">Open dashboard</a></p>`});
  await db.auditEvent.create({data:{eventType:"email_daily_summary",entityType:"System",entityId:date,payload:{to:mail.to}}});return true;
}
