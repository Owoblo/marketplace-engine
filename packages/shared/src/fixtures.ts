import type {NormalizedListing} from "./index.js";
const base=(id:string,title:string,description:string,status:NormalizedListing["status"]="active"):NormalizedListing=>({sourceType:"facebook_marketplace",externalListingId:id,listingUrl:`https://www.facebook.com/marketplace/item/${id}/`,title,description,currency:"CAD",imageUrls:[],status,locationText:"Windsor",rawSourcePayload:{fixture:true}});
export const listingFixtures={
  highIntentMovingSale:{...base("fixture-1","Moving sale — everything must go","Relocating next week. Couch, dining set, beds and dressers must go this week."),sellerExternalId:"seller-moving",sellerDisplayName:"Sarah",price:1200,publishedAt:new Date("2026-07-21T12:00:00Z")},
  lowValueChair:{...base("fixture-2","Single kitchen chair","Used chair, pickup only."),sellerExternalId:"seller-chair",price:15},
  fullHousehold:{...base("fixture-3","Complete house contents","Bedroom set, sectional, dining set, appliances and patio furniture."),sellerExternalId:"seller-household",price:3500},
  rentalProperty:{...base("fixture-4","Two-bedroom apartment for rent","Available next month in Windsor."),sellerExternalId:"seller-landlord",price:1800},
  officeClosure:{...base("fixture-5","Office closing — furniture clearance","Desks, filing cabinets and boardroom table must go."),sellerExternalId:"seller-office",price:2200},
  applianceDelivery:{...base("fixture-6","Washer dryer pair","Working set, heavy, pickup only."),sellerExternalId:"seller-appliance",price:650},
  duplicateListing:{...base("fixture-1","Moving sale — everything must go","Relocating next week. Couch, dining set, beds and dressers must go this week."),sellerExternalId:"seller-moving",sellerDisplayName:"Sarah",price:1200},
  sellerMultipleA:{...base("fixture-7","Large sectional","Pickup in LaSalle."),sellerExternalId:"seller-multiple",price:700},
  sellerMultipleB:{...base("fixture-8","Dining room set","Table, eight chairs and hutch."),sellerExternalId:"seller-multiple",price:900},
  alreadyContacted:{...base("fixture-9","Bedroom set must go","Moving out this month."),sellerExternalId:"seller-contacted",price:800},
  suppressedSeller:{...base("fixture-10","Couch moving sale","Need gone today."),sellerExternalId:"seller-suppressed",price:400},
  removedListing:{...base("fixture-11","Refrigerator","No longer available","removed"),sellerExternalId:"seller-removed",price:500},
} as const;
