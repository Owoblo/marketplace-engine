const EARTH_RADIUS_KM = 6371.0088;
const radians = (degrees:number) => degrees * Math.PI / 180;

export function haversineKm(a:{latitude:number;longitude:number},b:{latitude:number;longitude:number}):number {
  const dLat=radians(b.latitude-a.latitude), dLon=radians(b.longitude-a.longitude);
  const lat1=radians(a.latitude), lat2=radians(b.latitude);
  const h=Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
  return 2*EARTH_RADIUS_KM*Math.asin(Math.sqrt(h));
}
