type StoredObject={body:BodyInit;httpMetadata?:{contentType?:string}};
type ProofBucket={put:(key:string,value:ArrayBuffer,options:{httpMetadata:{contentType:string}})=>Promise<unknown>;get:(key:string)=>Promise<StoredObject|null>};
type CloudflareContext={env?:{OUTREACH_PROOFS?:ProofBucket}};
export function proofBucket(){const context=(globalThis as Record<PropertyKey,unknown>)[Symbol.for("__cloudflare-context__")] as CloudflareContext|undefined,bucket=context?.env?.OUTREACH_PROOFS;if(!bucket)throw new Error("Outreach proof storage is not configured");return bucket}
