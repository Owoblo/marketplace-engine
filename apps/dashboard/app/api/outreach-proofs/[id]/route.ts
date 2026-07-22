import {prisma} from "@marketplace-engine/database";
import {proofBucket} from "../../../../lib/proof-storage";
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params,proof=await prisma.outreachProof.findUnique({where:{id}});if(!proof)return new Response("Not found",{status:404});const object=await proofBucket().get(proof.storageKey);if(!object)return new Response("Not found",{status:404});return new Response(object.body,{headers:{"Content-Type":proof.mimeType,"Cache-Control":"private, no-store"}})}
