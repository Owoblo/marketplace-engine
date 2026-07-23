import "./styles.css";
import "./forms.css";
import "./workflow.css";
import "./filters.css";
import "./outreach-metrics.css";
import Link from "next/link";
import {headers} from "next/headers";
export const metadata={title:"Saturn Star Marketplace Intelligence",description:"Human-operated Marketplace outreach intelligence"};
const links=[["/","Overview"],["/outreach","Outreach Queue"],["/owned-listings","Listings We Post"],["/listings","Listings"],["/opportunities","Opportunities"],["/retail-partners","Furniture Stores"],["/competitors","Competitors"],["/sellers","Sellers"],["/territories","Territories"],["/searches","Searches"],["/analytics","Analytics"],["/health","System Health"]];
export default async function Layout({children}:{children:React.ReactNode}){const role=(await headers()).get("x-marketplace-role"),visibleLinks=role==="MARKETPLACE_REP"?links.filter(([href])=>href==="/outreach"):links;return <html lang="en" suppressHydrationWarning><body suppressHydrationWarning><aside><div className="brand"><span>★</span><div><b>Saturn Star</b><small>Marketplace Intelligence</small></div></div><nav>{visibleLinks.map(([href,label])=><Link href={href!} key={href}>{label}</Link>)}</nav><div className="safety">Human send mode<br/><strong>Autonomous messaging off</strong></div></aside><main>{children}</main></body></html>}
