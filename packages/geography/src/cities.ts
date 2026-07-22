import type { CitySeed, RegionKey } from "./types.js";
import { normalizePlaceName } from "./normalization.js";

export const citiesByRegion: Record<RegionKey, readonly string[]> = {
  windsor:["Windsor","LaSalle","Tecumseh","Amherstburg","Lakeshore","Belle River","Comber","Stoney Point","St. Joachim","Puce","Emeryville","Anderdon","Leamington","Kingsville","Essex","Harrow","McGregor","Cottam","Ruthven","Colchester","Maidstone","Wheatley"],
  chatham:["Chatham","Chatham Kent","Tilbury","Wallaceburg","Dresden","Pain Court","Blenheim","Merlin","Charing Cross","Cedar Springs","Dealtown","Ridgetown","Thamesville","Bothwell","Highgate","Morpeth","Muirkirk","Mitchell's Bay","Lighthouse Cove","Erieau","Shrewsbury","Erie Beach"],
  sarnia:["Sarnia","Point Edward","Brights Grove","Camlachie","Corunna","Mooretown","Courtright","Sombra","Port Lambton","St. Clair","Dawn-Euphemia","Petrolia","Oil Springs","Brigden","Wyoming","Plympton-Wyoming","Watford","Warwick","Alvinston","Brooke-Alvinston","Arkona","Forest","Thedford","Grand Bend","Lambton Shores","Port Franks","Ipperwash"],
  london:["London","Lucan","Lucan Biddulph","Ailsa Craig","Parkhill","Ilderton","North Middlesex","Strathroy","Strathroy-Caradoc","Mount Brydges","Kerwood","Glencoe","Newbury","Wardsville","Adelaide-Metcalfe","Southwest Middlesex","Komoka","Middlesex Centre","Dorchester","Thames Centre","Belmont","St. Thomas","Central Elgin","Southwold","Talbotville","Shedden","Fingal","Port Stanley","Dutton","Dutton-Dunwich","West Lorne","Rodney","Aylmer","Springfield","Malahide","Bayham","Vienna","Port Burwell","St. Marys"],
  woodstock:["Woodstock","Ingersoll","Beachville","Sweaburg","Burgessville","Otterville","Norwich","Mount Elgin","Courtland","Tillsonburg","Tavistock","Thamesford","Innerkip","East Zorra-Tavistock","Embro","Hickson","Kintore","Zorra","Drumbo","Princeton","Plattsville","Bright","Delhi"],
  wkg:["Kitchener","Waterloo","Cambridge","Guelph","Elmira","St. Jacobs","Conestogo","Breslau","Woolwich","New Hamburg","Baden","Wellesley","Wilmot","Ayr","North Dumfries","Puslinch","Guelph-Eramosa","Rockwood","Fergus","Elora","Centre Wellington","Drayton","Mapleton","Arthur","Palmerston","Stratford","Listowel","Paris"],
  ottawa:["Ottawa","Kanata","Nepean","Orleans","Gloucester","Stittsville","Barrhaven","Manotick","Rockland","Carp"],
};

export const citySeeds: readonly CitySeed[] = Object.entries(citiesByRegion).flatMap(([regionKey,names]) => names.map((canonicalName) => ({regionKey:regionKey as RegionKey,canonicalName,normalizedName:normalizePlaceName(canonicalName)})));
