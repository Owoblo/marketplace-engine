import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

type HyperdriveContext={env?:{HYPERDRIVE?:{connectionString?:string}}};

function getClient(){
  const context=(globalThis as Record<PropertyKey,unknown>)[Symbol.for("__cloudflare-context__")] as HyperdriveContext|undefined;
  const connectionString=context?.env?.HYPERDRIVE?.connectionString??process.env.DATABASE_URL;
  if(!connectionString)throw new Error("Database connection is not configured");
  return new PrismaClient({adapter:new PrismaPg({connectionString}),log:process.env.NODE_ENV==="development"?["warn","error"]:["error"]});
}

export const prisma=new Proxy({} as PrismaClient,{
  get(_target,property){
    const client=getClient();
    const value=Reflect.get(client,property,client) as unknown;
    return typeof value==="function"?value.bind(client):value;
  },
});
