import {fallbackSellerExternalId,prisma} from "@marketplace-engine/database/node";

async function main(){
const sources=await prisma.source.findMany({select:{id:true,type:true}});let profilesCreated=0,listingsLinked=0;

for(const source of sources){
  const listings=await prisma.listing.findMany({
    where:{sourceId:source.id,sellerId:null,sellerDisplayName:{not:null}},
    select:{id:true,sellerDisplayName:true,lastObservedAt:true},
  });
  const groups=new Map<string,typeof listings>();
  for(const listing of listings){
    const name=listing.sellerDisplayName?.trim();if(!name)continue;
    const key=fallbackSellerExternalId(name),group=groups.get(key)??[];group.push(listing);groups.set(key,group);
  }
  for(const [externalSellerId,group] of groups){
    const displayName=group[0]!.sellerDisplayName!.trim();
    const where={sourceId_externalSellerId:{sourceId:source.id,externalSellerId}},existing=await prisma.sellerProfile.findUnique({where,select:{id:true}});
    const seller=await prisma.sellerProfile.upsert({where,update:{displayName,lastObservedAt:new Date(Math.max(...group.map(item=>item.lastObservedAt.getTime())))},create:{sourceId:source.id,externalSellerId,displayName,lastObservedAt:new Date(Math.max(...group.map(item=>item.lastObservedAt.getTime())))}});
    if(!existing)profilesCreated++;
    const result=await prisma.listing.updateMany({where:{id:{in:group.map(item=>item.id)},sellerId:null},data:{sellerId:seller.id}});listingsLinked+=result.count;
  }
}

console.log(JSON.stringify({profilesCreated,listingsLinked}));
}

const keepAlive=setInterval(()=>{},1_000);
main().catch(error=>{console.error(error);process.exitCode=1}).finally(async()=>{clearInterval(keepAlive);await prisma.$disconnect()});
