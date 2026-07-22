export type RegionKey = "windsor" | "chatham" | "sarnia" | "london" | "woodstock" | "wkg" | "ottawa";
export type LaunchPhase = "active" | "planned" | "paused";

export interface RegionSeed {
  key: RegionKey;
  name: string;
  province: "ON";
  country: "CA";
  timezone: "America/Toronto";
  bounds: { west: number; east: number; south: number; north: number };
  grid: { columns: number; rows: number; expectedCellCount: number; longitudeBreakpoints: readonly number[]; latitudeBreakpoints: readonly number[] };
  enabled: boolean;
  launchPhase: LaunchPhase;
}

export interface GeographicSearchCell {
  regionKey: RegionKey;
  cellKey: string;
  columnIndex: number;
  rowIndex: number;
  west: number;
  east: number;
  south: number;
  north: number;
  centerLongitude: number;
  centerLatitude: number;
  widthKm: number;
  heightKm: number;
  diagonalKm: number;
  facebookRadiusKm: number;
  enabled: boolean;
}

export interface CitySeed { regionKey: RegionKey; canonicalName: string; normalizedName: string }
export interface CityAliasSeed { regionKey: RegionKey; alias: string; normalizedAlias: string; canonicalName: string }

export interface FacebookSearchPoint { latitude: number; longitude: number; radiusKm: number; sourceCellKey: string; partIndex: number }
