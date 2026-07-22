import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { cityAliasSeeds, citySeeds, generateAllCells, regionSeeds, validateGeographySeeds } from "@marketplace-engine/geography";
import {DEFAULT_SCORING_WEIGHTS} from "@marketplace-engine/intelligence";

const connectionString=process.env.DATABASE_URL;
if(!connectionString)throw new Error("DATABASE_URL is required");
const databaseUrl=new URL(connectionString);
databaseUrl.searchParams.delete("sslmode");
const prisma=new PrismaClient({adapter:new PrismaPg({connectionString:databaseUrl.toString(),ssl:{rejectUnauthorized:false}})});
const families=[
  {key:"explicit_move",name:"Explicit move",terms:["moving sale","moving out","relocating","leaving province"],priority:100,frequencyMinutes:360},
  {key:"urgent_sale",name:"Urgent sale",terms:["must go","everything must go","need gone today"],priority:95,frequencyMinutes:360},
  {key:"household_furniture",name:"Household furniture",terms:["sectional","dining set","bedroom set","couch"],priority:70,frequencyMinutes:720},
  {key:"large_item_delivery",name:"Large item delivery",terms:["office furniture"],priority:65,frequencyMinutes:720},
  {key:"appliances",name:"Appliances",terms:["washer dryer","refrigerator"],priority:60,frequencyMinutes:1440},
  {key:"rental_property",name:"Rental property",terms:["apartment for rent","house for rent"],priority:65,frequencyMinutes:1440},
  {key:"commercial_change",name:"Commercial change",terms:["office closing","business closing","office furniture"],priority:70,frequencyMinutes:1440},
  {key:"storage_clearout",name:"Storage clear-out",terms:["storage locker"],priority:60,frequencyMinutes:1440},
  {key:"equipment",name:"Heavy and specialty items",terms:["piano","hot tub","safe","pool table","commercial machinery","woodworking equipment","restaurant equipment","vending machine","riding mower","farm equipment"],priority:65,frequencyMinutes:360},
];

async function main(){
  validateGeographySeeds();
  const rep=await prisma.user.upsert({where:{email:process.env.SEED_REP_EMAIL??"marketplace@saturnstarmovers.ca"},update:{},create:{email:process.env.SEED_REP_EMAIL??"marketplace@saturnstarmovers.ca",name:"Marketplace Rep",role:"MARKETPLACE_REP"}});
  await prisma.user.upsert({where:{email:process.env.SEED_ADMIN_EMAIL??"admin@saturnstarmovers.ca"},update:{},create:{email:process.env.SEED_ADMIN_EMAIL??"admin@saturnstarmovers.ca",name:"Marketplace Admin",role:"ADMIN"}});
  await prisma.scoringConfiguration.upsert({where:{key:"default-v1"},update:{weights:DEFAULT_SCORING_WEIGHTS},create:{key:"default-v1",name:"Default opportunity scoring",weights:DEFAULT_SCORING_WEIGHTS,thresholds:{immediate:85,standard:70,review:50,low:30,skip:0}}});
  const sourceConfiguration={rateLimitPerMinute:3,maxListingAgeDays:7,includeListingsWithUnknownAge:true,excludedLocationTerms:["Detroit","Michigan","Dearborn","Livonia","Southfield","Port Huron","United States","USA"]};
  const source=await prisma.source.upsert({where:{type:"facebook_marketplace"},update:{configuration:sourceConfiguration},create:{name:"Facebook Marketplace",type:"facebook_marketplace",configuration:sourceConfiguration}});
  for(const seed of regionSeeds){
    const region=await prisma.region.upsert({where:{key:seed.key},update:{name:seed.name,west:seed.bounds.west,east:seed.bounds.east,south:seed.bounds.south,north:seed.bounds.north,gridColumns:seed.grid.columns,gridRows:seed.grid.rows,launchPhase:"ACTIVE"},create:{key:seed.key,name:seed.name,province:seed.province,country:seed.country,timezone:seed.timezone,west:seed.bounds.west,east:seed.bounds.east,south:seed.bounds.south,north:seed.bounds.north,gridColumns:seed.grid.columns,gridRows:seed.grid.rows,launchPhase:"ACTIVE"}});
    await prisma.regionGridDefinition.upsert({where:{regionId:region.id},update:{longitudeBreakpoints:[...seed.grid.longitudeBreakpoints],latitudeBreakpoints:[...seed.grid.latitudeBreakpoints],expectedCellCount:seed.grid.expectedCellCount},create:{regionId:region.id,longitudeBreakpoints:[...seed.grid.longitudeBreakpoints],latitudeBreakpoints:[...seed.grid.latitudeBreakpoints],expectedCellCount:seed.grid.expectedCellCount}});
    await prisma.regionLaunchConfiguration.upsert({where:{regionId:region.id},update:{marketplaceDiscoveryEnabled:true,outreachEnabled:true,followUpsEnabled:true,crmPushEnabled:true,dailyTaskLimit:50,dailySellerContactLimit:50,minimumOpportunityScore:70},create:{regionId:region.id,marketplaceDiscoveryEnabled:true,outreachEnabled:true,followUpsEnabled:true,crmPushEnabled:true,dailyTaskLimit:50,dailySellerContactLimit:50,minimumOpportunityScore:70}});
    const territory=await prisma.territory.upsert({where:{id:`territory-${seed.key}`},update:{assignedRepId:rep.id,enabled:true},create:{id:`territory-${seed.key}`,regionId:region.id,name:seed.name,primaryCity:seed.key==="wkg"?"Kitchener":seed.name.split(" /")[0]!,province:"ON",enabled:true,timezone:seed.timezone,assignedRepId:rep.id}});
    for(const cell of generateAllCells([seed])) {
      const values={columnIndex:cell.columnIndex,rowIndex:cell.rowIndex,west:cell.west,east:cell.east,south:cell.south,north:cell.north,centerLongitude:cell.centerLongitude,centerLatitude:cell.centerLatitude,widthKm:cell.widthKm,heightKm:cell.heightKm,diagonalKm:cell.diagonalKm,facebookRadiusKm:cell.facebookRadiusKm,enabled:true};
      await prisma.geographicSearchCell.upsert({where:{cellKey:cell.cellKey},update:values,create:{regionId:region.id,cellKey:cell.cellKey,...values}});
    }
    for(const city of citySeeds.filter((item)=>item.regionKey===seed.key)){const row=await prisma.city.upsert({where:{regionId_normalizedName:{regionId:region.id,normalizedName:city.normalizedName}},update:{canonicalName:city.canonicalName},create:{regionId:region.id,canonicalName:city.canonicalName,normalizedName:city.normalizedName}});await prisma.regionCityCoverage.upsert({where:{cityId:row.id},update:{primaryRegionId:region.id},create:{cityId:row.id,primaryRegionId:region.id}});for(const alias of cityAliasSeeds.filter((item)=>item.regionKey===seed.key&&item.canonicalName===city.canonicalName))await prisma.cityAlias.upsert({where:{cityId_normalizedAlias:{cityId:row.id,normalizedAlias:alias.normalizedAlias}},update:{alias:alias.alias},create:{cityId:row.id,alias:alias.alias,normalizedAlias:alias.normalizedAlias}})}
    for(const family of families){const qf=await prisma.queryFamily.upsert({where:{key:family.key},update:family,create:family});const term=family.terms[0]!;for(const cell of await prisma.geographicSearchCell.findMany({where:{regionId:region.id}}))await prisma.searchDefinition.upsert({where:{sourceId_cellId_query:{sourceId:source.id,cellId:cell.id,query:term}},update:{territoryId:territory.id,queryFamilyId:qf.id,name:`${cell.cellKey}: ${family.name}`,radiusKm:cell.facebookRadiusKm,searchFrequencyMinutes:family.frequencyMinutes,priority:family.priority,enabled:true},create:{sourceId:source.id,territoryId:territory.id,cellId:cell.id,queryFamilyId:qf.id,name:`${cell.cellKey}: ${family.name}`,query:term,radiusKm:cell.facebookRadiusKm,searchFrequencyMinutes:family.frequencyMinutes,priority:family.priority}})}
    if(seed.key==="windsor"){const campaign=await prisma.ownedListingCampaign.upsert({where:{id:"campaign-windsor-delivery"},update:{},create:{id:"campaign-windsor-delivery",territoryId:territory.id,sourceId:source.id,name:"Windsor delivery services",serviceType:"furniture_delivery",weeklyLimit:2}});if((await prisma.ownedListingDraft.count({where:{campaignId:campaign.id}}))===0)await prisma.ownedListingDraft.createMany({data:[{campaignId:campaign.id,title:"Local furniture pickup and delivery — Windsor area",description:"Saturn Star provides local pickup and delivery for couches, sectionals, dining sets, bedroom furniture, appliances, and other large items. Message with pickup and delivery locations for availability."},{campaignId:campaign.id,title:"Marketplace purchase delivery help",description:"Buying or selling a large Marketplace item? Saturn Star can help with pickup, careful loading, transport, and delivery across Windsor and Essex County. Send the item and locations for a quote."}]});}
  }
}
main().finally(()=>prisma.$disconnect());
