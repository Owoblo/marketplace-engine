import "dotenv/config";
import {prisma} from "@marketplace-engine/database/node";
import {sendOpportunityDigest} from "../apps/worker/src/email-alerts.js";

async function main(){console.log(JSON.stringify(await sendOpportunityDigest(prisma)));}
main().finally(()=>prisma.$disconnect());
