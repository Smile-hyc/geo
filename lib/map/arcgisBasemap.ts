/**
 * ArcGIS Online 公共矢量街道底图（与 Leaflet XYZ 对齐）。
 * 文档：https://developers.arcgis.com/documentation/mapping-apis-and-location-services/maps/services/
 */
export const ARCGIS_WORLD_STREET_TILE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}";

export const ARCGIS_TILE_ATTRIBUTION =
  'Tiles &copy; <a href="https://www.esri.com/" target="_blank" rel="noreferrer noopener">Esri</a> &mdash; Source: Esri, Garmin, HERE, FAO, NOAA, USGS, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, and the GIS User Community';

export const ARCGIS_TILE_MAX_ZOOM = 19;
