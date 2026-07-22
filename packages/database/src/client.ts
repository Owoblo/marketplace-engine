import { PrismaClient } from "@prisma/client";

const globalPrisma=globalThis as unknown as {marketplacePrisma?:PrismaClient};
export const prisma=globalPrisma.marketplacePrisma??new PrismaClient({log:process.env.NODE_ENV==="development"?["warn","error"]:["error"]});
if(process.env.NODE_ENV!=="production")globalPrisma.marketplacePrisma=prisma;
