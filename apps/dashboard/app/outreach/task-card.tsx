"use client";
import {useState} from "react";
import {claimTask,createLead,recordReply,saveConversationUrl,suppressSeller,updateTask} from "../actions";

export interface QueueTask {id:string;title:string;seller:string;city:string;score:number;message:string;url:string;conversationUrl:string|null;sourceType:string;sourceName:string;publicPhone:string|null;explanation:string[];history:string[];taskType:string;status:string;proofId?:string|null;claimedByMe?:boolean}
const skipReasons=[['listing_removed','Listing removed or expired'],['not_a_fit','Not a fit'],['competitor','Competitor advertisement'],['duplicate','Duplicate'],['already_contacted','Already contacted'],['outside_service_area','Outside service area'],['other','Other']] as const;

export function TaskCard({task,restricted=false}:{task:QueueTask;restricted?:boolean}){
  const [message,setMessage]=useState(task.message),[copied,setCopied]=useState(false),[linkCopied,setLinkCopied]=useState(false),sent=task.status==="SENT";
  async function copy(value:string,setter:(value:boolean)=>void){await navigator.clipboard.writeText(value);setter(true);setTimeout(()=>setter(false),1500)}
  if(restricted&&!task.claimedByMe)return <article className="task"><div className="placeholder">★</div><div className="taskBody"><div className="taskTitle"><div><h2>{task.title}</h2><p>{task.seller} · {task.city} · {task.sourceName}</p></div><b className="bigScore">{task.score}</b></div><p className="explain">Claim this opportunity to reveal its message and listing link. The claim lasts 30 minutes.</p><form action={claimTask}><input type="hidden" name="taskId" value={task.id}/><button className="primary">Claim task</button></form></div></article>;
  return <article className="task"><div className="placeholder">★</div><div className="taskBody">
    <div className="taskTitle"><div><h2>{task.title}</h2><p>{task.seller} · {task.city} · {task.sourceName} · {task.taskType.replaceAll("_"," ")} · {task.status}</p></div><b className="bigScore">{task.score}</b></div>
    <p className="explain">{task.explanation.join(" · ")||"No score explanation recorded"}</p>
    {task.publicPhone&&<p><b>Published contact:</b> {task.publicPhone} · verify consent/contact basis and do-not-call status before calling or texting.</p>}
    {task.history.length>0&&<p><b>History:</b> {task.history.join(" · ")}</p>}
    {task.proofId&&!restricted&&<p><a href={`/api/outreach-proofs/${task.proofId}`} target="_blank" rel="noreferrer">View send proof ↗</a></p>}
    <textarea value={message} onChange={event=>setMessage(event.target.value)} maxLength={400} readOnly={sent}/>
    <div className="actions">
      <button className="primary" type="button" onClick={()=>copy(message,setCopied)}>{copied?"Copied":"Copy message"}</button>
      <a className="button" href={task.conversationUrl??task.url} target="_blank" rel="noreferrer">{task.conversationUrl?"Open conversation ↗":`Open in ${task.sourceName} ↗`}</a>
      <button type="button" onClick={()=>copy(task.url,setLinkCopied)}>{linkCopied?"Link copied":"Copy listing link"}</button>
      {!sent&&<form action={updateTask}><input type="hidden" name="taskId" value={task.id}/><input type="hidden" name="action" value="sent"/><input type="hidden" name="finalMessage" value={message}/>{restricted&&<label>Send proof <input name="proof" type="file" accept="image/png,image/jpeg,image/webp" required/></label>}<button>Mark sent</button></form>}
      {!sent&&<form action={updateTask}><input type="hidden" name="taskId" value={task.id}/><input type="hidden" name="action" value="skip"/><select name="skipReason" required defaultValue=""><option value="" disabled>Why skip?</option>{skipReasons.map(([value,label])=><option value={value} key={value}>{label}</option>)}</select><input name="notes" placeholder="Optional note"/><button>Skip</button></form>}
      {!sent&&!restricted&&<form action={updateTask}><input type="hidden" name="taskId" value={task.id}/><input type="hidden" name="action" value="snooze"/><button>Snooze</button></form>}
      {!restricted&&<form action={suppressSeller}><input type="hidden" name="taskId" value={task.id}/><button>Suppress seller</button></form>}
    </div>
    {!restricted&&<details open={sent}><summary>Conversation, reply, and lead checklist</summary><div className="detailForms">
      <form action={saveConversationUrl}><input type="hidden" name="taskId" value={task.id}/><input name="conversationUrl" type="url" defaultValue={task.conversationUrl??""} placeholder={`Paste ${task.sourceName} conversation URL`} required/><button>Save conversation</button></form>
      <form action={recordReply}><input type="hidden" name="taskId" value={task.id}/><select name="responseStatus" defaultValue="positive_response"><option value="no_response">No response</option><option value="positive_response">Positive response</option><option value="maybe_later">Maybe later — follow up</option><option value="asked_for_price">Asked for price</option><option value="asked_for_phone_call">Asked for phone call</option><option value="provided_phone">Provided phone</option><option value="provided_email">Provided email</option><option value="requested_estimate">Requested estimate</option><option value="booked">Booked</option><option value="not_interested">Not interested</option><option value="wrong_person">Wrong person</option><option value="spam_complaint">Spam complaint</option><option value="seller_blocked_us">Seller blocked us</option><option value="listing_removed">Listing removed</option></select><input name="notes" placeholder="Reply notes or quote request"/><button>Record reply</button></form>
      <form action={createLead}><input type="hidden" name="taskId" value={task.id}/><input name="name" placeholder="Customer name"/><input name="phone" defaultValue={task.publicPhone??""} placeholder="Phone"/><input type="hidden" name="contactSource" value={task.publicPhone?"public_kijiji_listing":"rep_provided"}/><select name="contactPermissionStatus" defaultValue={task.publicPhone?"UNVERIFIED_PUBLIC_LISTING":"EXPRESS_CONSENT"}><option value="UNVERIFIED_PUBLIC_LISTING">Public listing — review first</option><option value="EXPRESS_CONSENT">Express consent received</option><option value="EXISTING_BUSINESS_RELATIONSHIP">Existing business relationship</option><option value="BUSINESS_NUMBER">Business contact number</option></select><input name="email" placeholder="Email"/><input name="originCity" placeholder="Origin city"/><input name="destinationCity" placeholder="Destination city"/><button>Create CRM-ready lead</button></form>
    </div></details>}
  </div></article>;
}
