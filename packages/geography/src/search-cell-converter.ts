import type { FacebookSearchPoint, GeographicSearchCell } from "./types.js";

export function toFacebookSearchPoints(cell:GeographicSearchCell,maxRadiusKm=100):FacebookSearchPoint[] {
  if(cell.facebookRadiusKm<=maxRadiusKm) return [{latitude:cell.centerLatitude,longitude:cell.centerLongitude,radiusKm:cell.facebookRadiusKm,sourceCellKey:cell.cellKey,partIndex:0}];
  const columns=Math.ceil(cell.facebookRadiusKm/maxRadiusKm), rows=columns, points:FacebookSearchPoint[]=[];
  for(let row=0;row<rows;row++) for(let column=0;column<columns;column++) {
    const west=cell.west+(cell.east-cell.west)*column/columns, east=cell.west+(cell.east-cell.west)*(column+1)/columns;
    const south=cell.south+(cell.north-cell.south)*row/rows, north=cell.south+(cell.north-cell.south)*(row+1)/rows;
    points.push({latitude:(south+north)/2,longitude:(west+east)/2,radiusKm:Math.min(maxRadiusKm,Math.ceil(cell.facebookRadiusKm/columns)),sourceCellKey:cell.cellKey,partIndex:points.length});
  }
  return points;
}
