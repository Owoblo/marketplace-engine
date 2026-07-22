import { haversineKm } from "./distance.js";
import type { GeographicSearchCell, RegionSeed } from "./types.js";

export function generateRegionCells(region:RegionSeed,coverageBufferMultiplier=1.10):GeographicSearchCell[] {
  const cells:GeographicSearchCell[]=[];
  for(let rowIndex=0;rowIndex<region.grid.rows;rowIndex++) for(let columnIndex=0;columnIndex<region.grid.columns;columnIndex++) {
    const west=region.grid.longitudeBreakpoints[columnIndex]!, east=region.grid.longitudeBreakpoints[columnIndex+1]!;
    const south=region.grid.latitudeBreakpoints[rowIndex]!, north=region.grid.latitudeBreakpoints[rowIndex+1]!;
    const centerLongitude=(west+east)/2, centerLatitude=(south+north)/2;
    const widthKm=haversineKm({latitude:centerLatitude,longitude:west},{latitude:centerLatitude,longitude:east});
    const heightKm=haversineKm({latitude:south,longitude:centerLongitude},{latitude:north,longitude:centerLongitude});
    const diagonalKm=Math.max(
      haversineKm({latitude:south,longitude:west},{latitude:north,longitude:east}),
      haversineKm({latitude:south,longitude:east},{latitude:north,longitude:west}),
    );
    cells.push({regionKey:region.key,cellKey:`${region.key}-r${rowIndex}-c${columnIndex}`,rowIndex,columnIndex,west,east,south,north,centerLongitude,centerLatitude,widthKm,heightKm,diagonalKm,facebookRadiusKm:Math.ceil(diagonalKm/2*coverageBufferMultiplier),enabled:true});
  }
  return cells;
}

export const generateAllCells=(regions:readonly RegionSeed[],buffer=1.10)=>regions.flatMap((r)=>generateRegionCells(r,buffer));
