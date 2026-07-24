import type {NormalizedListing} from "@marketplace-engine/shared";

export interface CoverageBounds {
  west:number;
  east:number;
  south:number;
  north:number;
}

const explicitUnitedStatesLocation=/\b(?:MI|Michigan|United States|USA|U\.S\.A\.)\b/i;

export function isFacebookListingInCoverage(
  listing:Pick<NormalizedListing,"latitude"|"longitude"|"locationText">,
  bounds:CoverageBounds,
):boolean {
  if(listing.locationText&&explicitUnitedStatesLocation.test(listing.locationText))return false;
  if(listing.latitude==null||listing.longitude==null)return true;
  return listing.latitude>=bounds.south&&listing.latitude<=bounds.north&&listing.longitude>=bounds.west&&listing.longitude<=bounds.east;
}

export function filterFacebookListingsForCoverage(
  listings:readonly NormalizedListing[],
  bounds:CoverageBounds,
):NormalizedListing[] {
  return listings.filter(listing=>isFacebookListingInCoverage(listing,bounds));
}
