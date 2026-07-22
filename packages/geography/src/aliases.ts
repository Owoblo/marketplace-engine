import { normalizePlaceName } from "./normalization.js";
import type { CityAliasSeed } from "./types.js";

const aliases = [
  {regionKey:"windsor",alias:"Colchester South",canonicalName:"Colchester"},
  {regionKey:"windsor",alias:"East Harrow",canonicalName:"Harrow"},
  {regionKey:"windsor",alias:"Gosfield North",canonicalName:"Essex"},
  {regionKey:"windsor",alias:"South Talbot Kingsville",canonicalName:"Kingsville"},
  {regionKey:"chatham",alias:"Chatham-Kent",canonicalName:"Chatham Kent"},
  {regionKey:"chatham",alias:"Dufferin Tilbury",canonicalName:"Tilbury"},
] as const;

export const cityAliasSeeds: readonly CityAliasSeed[] = aliases.map((item) => ({...item,normalizedAlias:normalizePlaceName(item.alias)}));
