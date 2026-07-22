import "./styles.css";
import "./forms.css";
import "./workflow.css";
import Link from "next/link";
export const metadata={title:"Saturn Star Marketplace Intelligence",description:"Human-operated Marketplace outreach intelligence"};
const links=[["/","Overview"],["/outreach","Outreach Queue"],["/owned-listings","Listings We Post"],["/listings","Listings"],["/opportunities","Opportunities"],["/competitors","Competitors"],["/sellers","Sellers"],["/territories","Territories"],["/searches","Searches"],["/analytics","Analytics"],["/health","System Health"]];
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en" suppressHydrationWarning><body suppressHydrationWarning><aside><div className="brand"><span>★</span><div><b>Saturn Star</b><small>Marketplace Intelligence</small></div></div><nav>{links.map(([href,label])=><Link href={href!} key={href}>{label}</Link>)}</nav><div className="safety">Human send mode<br/><strong>Autonomous messaging off</strong></div></aside><main>{children}</main></body></html>}
