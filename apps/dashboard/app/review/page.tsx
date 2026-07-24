import {prisma} from "@marketplace-engine/database";

export const dynamic="force-dynamic";
const strings=(value:unknown)=>Array.isArray(value)?value.filter((item):item is string=>typeof item==="string"):[];

export default async function ReviewQueue(){
  const rows=await prisma.opportunity.findMany({
    where:{OR:[{recommendedAction:"monitor"},{confidence:{lt:.68}}],qualificationStatus:"UNREVIEWED"},
    include:{listing:{include:{source:true}},territory:true},
    orderBy:[{createdAt:"desc"},{confidence:"asc"}],
    take:200,
  });
  return <><header><div><p className="eyebrow">HUMAN REVIEW</p><h1>Needs Review</h1><p>{rows.length} ambiguous listings are held out of outreach until their title, description, and available images support a confident decision.</p></div></header>
    <section className="review-grid">{rows.map(row=>{const images=strings(row.listing.imageUrls);return <article className="panel" key={row.id}>
      <div className="review-images">{images.slice(0,3).map(url=><img key={url} src={url} alt="" loading="lazy"/>)}</div>
      <p className="eyebrow">{row.listing.source.name} · {row.territory.name}</p>
      <h2><a href={row.listing.listingUrl} target="_blank" rel="noreferrer">{row.listing.title}</a></h2>
      <p>{row.listing.description??"No description was captured."}</p>
      <p><b>Provisional:</b> {row.opportunityType.replaceAll("_"," ")} · {Math.round(row.confidence*100)}% confidence · score {row.opportunityScore}</p>
      <p>{row.reasoningSummary}</p>
    </article>})}{!rows.length&&<div className="panel"><p>No listings currently need manual classification review.</p></div>}</section>
  </>;
}
