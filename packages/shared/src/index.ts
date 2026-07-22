import { z } from "zod";

export const opportunityTypes=["residential_move","furniture_delivery","appliance_delivery","rental_move","office_move","packing","junk_removal","labour_only","equipment_purchase","competitor","irrelevant"] as const;
export const intentCategories=["explicit_moving","likely_moving","item_delivery","property_turnover","commercial_change","weak_signal","none"] as const;
export const recommendedActions=["contact_now","contact_later","monitor","skip"] as const;

export const classificationSchema=z.object({
  opportunityType:z.enum(opportunityTypes), intentCategory:z.enum(intentCategories),
  confidence:z.number().min(0).max(1), urgency:z.number().min(0).max(100),
  estimatedJobSize:z.enum(["small","medium","large","unknown"]),
  positiveSignals:z.array(z.string().min(1)).max(20), negativeSignals:z.array(z.string().min(1)).max(20),
  recommendedAction:z.enum(recommendedActions), reasoningSummary:z.string().min(1).max(600),
});
export type Classification=z.infer<typeof classificationSchema>;

export const normalizedListingSchema=z.object({
  sourceType:z.string(), externalListingId:z.string().min(1), listingUrl:z.string().url(), sellerExternalId:z.string().optional(), sellerDisplayName:z.string().optional(),
  title:z.string(), description:z.string().optional(), price:z.number().nonnegative().optional(), currency:z.string().length(3).default("CAD"), category:z.string().optional(), condition:z.string().optional(), locationText:z.string().optional(), latitude:z.number().min(-90).max(90).optional(), longitude:z.number().min(-180).max(180).optional(), imageUrls:z.array(z.string().url()).default([]), publicContactPhone:z.string().min(7).optional(), publishedAt:z.coerce.date().optional(), status:z.enum(["active","pending","sold","removed","unknown"]), rawSourcePayload:z.unknown(),
});
export type NormalizedListing=z.infer<typeof normalizedListingSchema>;

export const envSchema=z.object({ DATABASE_URL:z.string().min(1),DIRECT_URL:z.string().min(1), FACEBOOK_MAX_REQUESTS_PER_MINUTE:z.coerce.number().int().min(1).max(10).default(3), FACEBOOK_MAX_RADIUS_KM:z.coerce.number().positive().default(100), FACEBOOK_COVERAGE_BUFFER_MULTIPLIER:z.coerce.number().min(1).max(2).default(1.1), SATURN_STAR_PHONE:z.string().min(7), CRM_MODE:z.enum(["stub","webhook"]).default("stub"), CRM_WEBHOOK_URL:z.string().url().optional(),DASHBOARD_ROLE:z.enum(["ADMIN","MANAGER","MARKETPLACE_REP"]).default("MARKETPLACE_REP") });

export function stableListingHash(input:NormalizedListing):string {
  const value=[input.title,input.description??"",input.price??"",input.status,input.locationText??""].join("\u001f").normalize("NFKC").trim().toLowerCase();
  let hash=2166136261; for(let i=0;i<value.length;i++){hash^=value.charCodeAt(i);hash=Math.imul(hash,16777619)} return (hash>>>0).toString(16).padStart(8,"0");
}
export {listingFixtures} from "./fixtures.js";
