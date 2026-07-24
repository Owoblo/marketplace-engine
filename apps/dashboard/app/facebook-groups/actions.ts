"use server";
import {createHash} from "node:crypto";
import {revalidatePath} from "next/cache";
import {prisma} from "@marketplace-engine/database";
import {classifyFacebookGroupPost} from "@marketplace-engine/intelligence";
import {z} from "zod";
import {requireRole} from "../../lib/auth";

const groupUrl=z.string().url().refine(value=>{try{return /(^|\.)facebook\.com$/i.test(new URL(value).hostname)&&new URL(value).pathname.startsWith("/groups/")}catch{return false}},"Use a Facebook group URL");

export async function createFacebookGroup(formData:FormData){
  requireRole("MANAGER");
  const input=z.object({regionId:z.string().min(1),name:z.string().trim().min(2).max(120),groupUrl,accessType:z.enum(["PUBLIC","PRIVATE","UNKNOWN"]),outreachPolicy:z.enum(["COMMENTS_ALLOWED","DIRECT_MESSAGE_ONLY","MONITOR_ONLY","REVIEW_RULES"]),rulesSummary:z.string().trim().max(1000).optional(),searchPriority:z.coerce.number().int().min(0).max(100)}).parse(Object.fromEntries(formData));
  await prisma.facebookGroup.upsert({where:{groupUrl:input.groupUrl},update:{regionId:input.regionId,name:input.name,accessType:input.accessType,outreachPolicy:input.outreachPolicy,rulesSummary:input.rulesSummary||null,searchPriority:input.searchPriority,lastReviewedAt:new Date()},create:{...input,rulesSummary:input.rulesSummary||null,lastReviewedAt:new Date()}});
  await prisma.auditEvent.create({data:{eventType:"facebook_group_registered",entityType:"FacebookGroup",payload:{name:input.name,groupUrl:input.groupUrl,outreachPolicy:input.outreachPolicy}}});
  revalidatePath("/facebook-groups");
}

export async function captureFacebookGroupPost(formData:FormData){
  requireRole("MARKETPLACE_REP");
  const input=z.object({groupId:z.string().min(1),postUrl:z.string().url(),authorDisplayName:z.string().trim().max(120).optional(),locationText:z.string().trim().max(200).optional(),originalText:z.string().trim().min(8).max(12000),imageUrls:z.string().trim().max(6000).optional(),postedAt:z.string().optional()}).parse(Object.fromEntries(formData));
  const group=await prisma.facebookGroup.findUniqueOrThrow({where:{id:input.groupId}});
  if(!input.postUrl.includes("facebook.com/"))throw new Error("A Facebook post URL is required");
  const classification=classifyFacebookGroupPost({
    text:input.originalText,
    ...(input.authorDisplayName?{authorDisplayName:input.authorDisplayName}:{}),
    ...(input.locationText?{locationText:input.locationText}:{}),
  });
  const classificationData={opportunityType:classification.opportunityType,intentCategory:classification.intentCategory,confidence:classification.confidence,opportunityScore:classification.score,reasoningSummary:classification.reasoningSummary,positiveSignals:classification.positiveSignals,negativeSignals:classification.negativeSignals,recommendedAction:classification.recommendedAction,suggestedComment:classification.suggestedComment??null,suggestedDirectMessage:classification.suggestedDirectMessage??null};
  const normalized=input.originalText.normalize("NFKC").toLowerCase().replace(/\s+/g," ").trim();
  const contentHash=createHash("sha256").update(normalized).digest("hex");
  const images=(input.imageUrls??"").split(/\r?\n|,/).map(value=>value.trim()).filter(Boolean).slice(0,10);
  const postedAt=input.postedAt?new Date(input.postedAt):null;
  const existing=await prisma.facebookGroupPost.findUnique({where:{postUrl:input.postUrl},select:{id:true}});
  const row=await prisma.facebookGroupPost.upsert({where:{postUrl:input.postUrl},update:{lastObservedAt:new Date(),originalText:input.originalText,authorDisplayName:input.authorDisplayName||null,locationText:input.locationText||null,imageUrls:images,contentHash,...classificationData},create:{groupId:group.id,postUrl:input.postUrl,authorDisplayName:input.authorDisplayName||null,locationText:input.locationText||null,originalText:input.originalText,imageUrls:images,postedAt:postedAt&&!Number.isNaN(postedAt.getTime())?postedAt:null,contentHash,...classificationData}});
  await prisma.auditEvent.create({data:{eventType:existing?"facebook_group_post_refreshed":"facebook_group_post_captured",entityType:"FacebookGroupPost",entityId:row.id,payload:{groupId:group.id,score:classification.score,opportunityType:classification.opportunityType}}});
  revalidatePath("/facebook-groups");
}

export async function reviewFacebookGroupPost(formData:FormData){
  requireRole("MARKETPLACE_REP");
  const input=z.object({id:z.string(),status:z.enum(["APPROVED","CONTACTED","MONITORING","SKIPPED","EXPIRED"]),notes:z.string().trim().max(1000).optional()}).parse(Object.fromEntries(formData));
  await prisma.facebookGroupPost.update({where:{id:input.id},data:{reviewStatus:input.status,reviewedAt:new Date(),reviewNotes:input.notes||null}});
  await prisma.auditEvent.create({data:{eventType:"facebook_group_post_reviewed",entityType:"FacebookGroupPost",entityId:input.id,payload:{status:input.status,notes:input.notes??null}}});
  revalidatePath("/facebook-groups");
}

export async function toggleFacebookGroup(formData:FormData){
  requireRole("MANAGER");
  const input=z.object({id:z.string(),enabled:z.enum(["true","false"])}).parse(Object.fromEntries(formData));
  await prisma.facebookGroup.update({where:{id:input.id},data:{enabled:input.enabled==="true"}});
  revalidatePath("/facebook-groups");
}
