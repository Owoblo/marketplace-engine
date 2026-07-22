import { cityAliasSeeds } from "./aliases.js";
import { citySeeds, citiesByRegion } from "./cities.js";
import { generateAllCells, generateRegionCells } from "./grid-generator.js";
import { normalizePlaceName } from "./normalization.js";
import { regionSeeds } from "./regions.js";

export function validateGeographySeeds():void {
  if(regionSeeds.length!==7) throw new Error(`Expected 7 regions, got ${regionSeeds.length}`);
  if(citySeeds.length!==171) throw new Error(`Expected 171 cities, got ${citySeeds.length}`);
  if(generateAllCells(regionSeeds).length!==55) throw new Error("Expected 55 canonical cells");
  for(const region of regionSeeds){
    const {grid,bounds}=region;
    if(grid.longitudeBreakpoints.length!==grid.columns+1||grid.latitudeBreakpoints.length!==grid.rows+1) throw new Error(`${region.key}: breakpoint dimensions`);
    if(grid.expectedCellCount!==grid.columns*grid.rows||generateRegionCells(region).length!==grid.expectedCellCount) throw new Error(`${region.key}: cell count`);
    if(grid.longitudeBreakpoints[0]!==bounds.west||grid.longitudeBreakpoints.at(-1)!==bounds.east||grid.latitudeBreakpoints[0]!==bounds.south||grid.latitudeBreakpoints.at(-1)!==bounds.north) throw new Error(`${region.key}: bounds mismatch`);
    for(const values of [grid.longitudeBreakpoints,grid.latitudeBreakpoints]) for(let i=1;i<values.length;i++) if(values[i]!<=values[i-1]!) throw new Error(`${region.key}: breakpoints not ascending`);
    const names=citiesByRegion[region.key].map(normalizePlaceName); if(new Set(names).size!==names.length) throw new Error(`${region.key}: duplicate canonical city`);
  }
  for(const alias of cityAliasSeeds) if(!citySeeds.some((city)=>city.regionKey===alias.regionKey&&city.canonicalName===alias.canonicalName)) throw new Error(`${alias.alias}: missing canonical city`);
}

export function matchCity(value:string){
  const normalized=normalizePlaceName(value);
  const city=citySeeds.find((item)=>item.normalizedName===normalized) ?? (()=>{const alias=cityAliasSeeds.find((item)=>item.normalizedAlias===normalized); return alias&&citySeeds.find((item)=>item.regionKey===alias.regionKey&&item.canonicalName===alias.canonicalName);})();
  return city ? {originalValue:value,canonicalName:city.canonicalName,regionKey:city.regionKey} : null;
}
