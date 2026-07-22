"use client";
import type {ChangeEvent} from "react";

export function OutreachFilters({territories,territory,minScore,type,source,opportunityTypes}:{territories:Array<{id:string;name:string}>;territory:string;minScore:string;type:string;source:string;opportunityTypes:readonly string[]}){
  const submit=(event:ChangeEvent<HTMLSelectElement>)=>event.currentTarget.form?.requestSubmit();
  return <form className="filters" method="get"><select name="territory" value={territory} onChange={submit}><option value="">All assigned territories</option>{territories.map(item=><option value={item.id} key={item.id}>{item.name}</option>)}</select><select name="minScore" value={minScore} onChange={submit}><option value="85">Score 85+</option><option value="70">Score 70+</option><option value="50">Score 50+</option><option value="0">All scores</option></select><select name="type" value={type} onChange={submit}><option value="">All types</option>{opportunityTypes.map(item=><option value={item} key={item}>{item.replaceAll("_"," ")}</option>)}</select><select name="source" value={source} onChange={submit}><option value="">All sources</option><option value="facebook_marketplace">Facebook Marketplace</option><option value="kijiji">Kijiji</option></select><button type="submit">Apply filters</button><a className="button" href="/outreach">Reset</a></form>;
}
