import {prisma} from "@marketplace-engine/database";

export const dynamic="force-dynamic";

export default async function RetailPartners(){
  const rows=await prisma.opportunity.findMany({where:{opportunityType:"retail_delivery_partner"},include:{listing:{include:{source:true}},territory:true,tasks:{orderBy:{createdAt:"desc"},take:1}},orderBy:[{opportunityScore:"desc"},{createdAt:"desc"}],take:300});
  return <><header><div><p className="eyebrow">PARTNERSHIP PROSPECTS</p><h1>Furniture stores</h1><p>{rows.length} furniture, mattress, showroom, warehouse, or catalogue-style sellers separated from direct moving competitors. Outreach is limited to one partnership approach per seller.</p></div></header><section className="panel"><table><thead><tr><th>Store or listing</th><th>Seller</th><th>Location</th><th>Source</th><th>Score</th><th>Outreach</th></tr></thead><tbody>{rows.map(row=><tr key={row.id}><td><a href={row.listing.listingUrl} target="_blank" rel="noreferrer">{row.listing.title}</a></td><td>{row.listing.sellerDisplayName??"Business name unavailable"}</td><td>{row.listing.locationText??row.territory.primaryCity}</td><td>{row.listing.source.name}</td><td><b className="score">{row.opportunityScore}</b></td><td>{row.tasks[0]?.status??"Not queued"}</td></tr>)}</tbody></table>{!rows.length&&<p>No furniture-store partnership prospects classified yet.</p>}</section></>;
}
