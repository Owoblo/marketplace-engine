import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalPrisma=globalThis as unknown as {marketplacePrisma?:PrismaClient};
const connectionString=process.env.DATABASE_URL;
if(!connectionString)throw new Error("DATABASE_URL is required");
const databaseUrl=new URL(connectionString);
databaseUrl.searchParams.delete("sslmode");
const adapter=new PrismaPg({connectionString:databaseUrl.toString(),ssl:{rejectUnauthorized:false}});
export const prisma=globalPrisma.marketplacePrisma??new PrismaClient({adapter,log:process.env.NODE_ENV==="development"?["warn","error"]:["error"]});
if(process.env.NODE_ENV!=="production")globalPrisma.marketplacePrisma=prisma;
