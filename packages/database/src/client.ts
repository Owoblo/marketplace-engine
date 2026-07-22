import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalPrisma=globalThis as unknown as {marketplacePrisma?:PrismaClient};
const connectionString=process.env.DATABASE_URL;
if(!connectionString)throw new Error("DATABASE_URL is required");
const adapter=new PrismaPg({connectionString});
export const prisma=globalPrisma.marketplacePrisma??new PrismaClient({adapter,log:process.env.NODE_ENV==="development"?["warn","error"]:["error"]});
if(process.env.NODE_ENV!=="production")globalPrisma.marketplacePrisma=prisma;
