import type { RegionSeed } from "./types.js";

export const regionSeeds = [
  { key:"windsor", name:"Windsor / Essex County", bounds:{west:-83.20,east:-82.45,south:41.90,north:42.45}, grid:{columns:3,rows:3,expectedCellCount:9,longitudeBreakpoints:[-83.20,-82.95,-82.70,-82.45],latitudeBreakpoints:[41.90,42.08333333,42.26666667,42.45]}, launchPhase:"active" },
  { key:"chatham", name:"Chatham-Kent", bounds:{west:-82.75,east:-81.75,south:42.15,north:42.70}, grid:{columns:2,rows:2,expectedCellCount:4,longitudeBreakpoints:[-82.75,-82.25,-81.75],latitudeBreakpoints:[42.15,42.425,42.70]}, launchPhase:"planned" },
  { key:"sarnia", name:"Sarnia / Lambton County", bounds:{west:-82.60,east:-81.55,south:42.60,north:43.40}, grid:{columns:2,rows:2,expectedCellCount:4,longitudeBreakpoints:[-82.60,-82.075,-81.55],latitudeBreakpoints:[42.60,43.00,43.40]}, launchPhase:"planned" },
  { key:"london", name:"London / Middlesex", bounds:{west:-81.90,east:-80.75,south:42.45,north:43.30}, grid:{columns:3,rows:3,expectedCellCount:9,longitudeBreakpoints:[-81.90,-81.51666667,-81.13333333,-80.75],latitudeBreakpoints:[42.45,42.73333333,43.01666667,43.30]}, launchPhase:"planned" },
  { key:"woodstock", name:"Woodstock / Oxford County", bounds:{west:-81.05,east:-80.45,south:42.75,north:43.40}, grid:{columns:2,rows:2,expectedCellCount:4,longitudeBreakpoints:[-81.05,-80.75,-80.45],latitudeBreakpoints:[42.75,43.075,43.40]}, launchPhase:"planned" },
  { key:"wkg", name:"Kitchener / Waterloo / Cambridge / Guelph", bounds:{west:-81.05,east:-80.10,south:43.15,north:43.85}, grid:{columns:3,rows:3,expectedCellCount:9,longitudeBreakpoints:[-81.05,-80.73333333,-80.41666667,-80.10],latitudeBreakpoints:[43.15,43.38333333,43.61666667,43.85]}, launchPhase:"planned" },
  { key:"ottawa", name:"Ottawa", bounds:{west:-76.40,east:-75.35,south:45.10,north:45.60}, grid:{columns:4,rows:4,expectedCellCount:16,longitudeBreakpoints:[-76.40,-76.1375,-75.875,-75.6125,-75.35],latitudeBreakpoints:[45.10,45.225,45.35,45.475,45.60]}, launchPhase:"planned" },
].map((region) => ({...region, province:"ON", country:"CA", timezone:"America/Toronto", enabled:true})) as readonly RegionSeed[];
