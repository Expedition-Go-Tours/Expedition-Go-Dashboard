import { useState, useRef, useEffect, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  X,
  Loader2,
  AlertTriangle,
  PenTool,
  Ban,
  Undo2,
  Trash2,
  CheckCircle2,
  MapPinned,
} from "lucide-react";

const defaultCenter = { lng: -0.187, lat: 5.6037 };
const TILE_STYLE = "https://tiles.openfreemap.org/styles/liberty";

const ZONE_FILL = "rgba(5, 150, 105, 0.22)";
const ZONE_LINE = "#047857";
const EXCL_FILL = "rgba(225, 29, 72, 0.18)";
const EXCL_LINE = "#e11d48";

function polygonFeature(coordinates) {
  return {
    type: "Feature",
    properties: {},
    geometry: { type: "Polygon", coordinates: [coordinates] },
  };
}

function workingFeatures(vertices) {
  const features = [];
  if (vertices.length >= 2) {
    features.push({
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates: vertices.map(([lat, lng]) => [lng, lat]) },
    });
  }
  if (vertices.length > 0) {
    features.push({
      type: "Feature",
      properties: {},
      geometry: {
        type: "MultiPoint",
        coordinates: vertices.map(([lat, lng]) => [lng, lat]),
      },
    });
  }
  return { type: "FeatureCollection", features };
}

/**
 * MapLibre GL polygon drawing tool for pickup geoshapes (service zone +
 * optional exclusion zones). Pure map-lng coords: polygons are arrays of
 * [lat, lng] vertices, matching the backend geoUtils schema.
 */
export default function PickupGeoshapeDrawer({
  title = "Draw pickup zone",
  description,
  initialZone,
  initialExclusions,
  onSave,
  onCancel,
}) {
  const [zone, setZone] = useState(() => (Array.isArray(initialZone) && initialZone.length >= 3 ? initialZone : []));
  const [exclusions, setExclusions] = useState(() => (Array.isArray(initialExclusions) ? initialExclusions.map((e) => [...e]) : []));
  const [working, setWorking] = useState([]);
  const [mode, setMode] = useState("zone");
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const initializedRef = useRef(false);
  const appendRef = useRef(null);
  const mapReadyRef = useRef(false);
  const failTimerRef = useRef(null);

  const appendVertex = useCallback((lat, lng) => {
    setWorking((v) => [...v, [lat, lng]]);
  }, []);
  useEffect(() => {
    appendRef.current = appendVertex;
  }, [appendVertex]);

  useEffect(() => {
    if (!mapContainerRef.current || initializedRef.current) return;
    initializedRef.current = true;

    let map;
    try {
      map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: TILE_STYLE,
        center: defaultCenter,
        zoom: 5,
      });
    } catch {
      // No WebGL / unsupported device → degrade to the error state instead
      // of crashing the editor.
      window.setTimeout(() => setMapError(true), 0);
      return;
    }

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    map.on("load", () => {
      if (failTimerRef.current != null) {
        window.clearTimeout(failTimerRef.current);
        failTimerRef.current = null;
      }
      mapReadyRef.current = true;
      setMapReady(true);

      map.addSource("gz-zone", { type: "geojson", data: polygonFeature(zone) });
      map.addLayer({ id: "gz-zone-fill", type: "fill", source: "gz-zone", paint: { "fill-color": ZONE_FILL } });
      map.addLayer({ id: "gz-zone-line", type: "line", source: "gz-zone", paint: { "line-color": ZONE_LINE, "line-width": 2 } });

      map.addSource("gz-excl", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: exclusions.map((e) => polygonFeature(e)),
        },
      });
      map.addLayer({ id: "gz-excl-fill", type: "fill", source: "gz-excl", paint: { "fill-color": EXCL_FILL } });
      map.addLayer({ id: "gz-excl-line", type: "line", source: "gz-excl", paint: { "line-color": EXCL_LINE, "line-width": 2, "line-dasharray": [2, 1] } });

      map.addSource("gz-working", { type: "geojson", data: workingFeatures(working) });
      map.addLayer({ id: "gz-working-line", type: "line", source: "gz-working", paint: { "line-color": "#0ea5e9", "line-width": 2 } });
      map.addLayer({ id: "gz-working-pts", type: "circle", source: "gz-working", paint: { "circle-radius": 5, "circle-color": "#0284c7", "circle-stroke-color": "#fff", "circle-stroke-width": 2 } });

      map.getCanvas().style.cursor = "crosshair";

      if (zone.length >= 3) {
        const bounds = new maplibregl.LngLatBounds();
        zone.forEach(([lat, lng]) => bounds.extend([lng, lat]));
        map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 0 });
      }
    });

    // Transient tile 404s are tolerated; only degrade when the style/server
    // itself fails to come up within a grace period.
    map.on("error", () => {
      if (!mapReadyRef.current && failTimerRef.current == null) {
        failTimerRef.current = window.setTimeout(() => {
          setMapError(true);
        }, 8000);
      }
    });
    map.on("click", (e) => appendRef.current?.(e.lngLat.lat, e.lngLat.lng));

    mapRef.current = map;
    return () => {
      if (failTimerRef.current != null) {
        window.clearTimeout(failTimerRef.current);
        failTimerRef.current = null;
      }
      mapReadyRef.current = false;
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function polygonFeatureForExclusions(list) {
    return { type: "FeatureCollection", features: list.map((e) => polygonFeature(e)) };
  }

  // Live-update sources when shapes change.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const ensure = (id, type, data) => {
      if (map.getSource(id)) map.getSource(id).setData(data);
    };
    ensure("gz-zone", "geojson", polygonFeature(zone));
    ensure(
      "gz-excl",
      "geojson",
      zone.length === 0 && exclusions.length === 0 ? { type: "FeatureCollection", features: [] } : polygonFeatureForExclusions(exclusions)
    );
    ensure("gz-working", "geojson", workingFeatures(working));
  }, [zone, exclusions, working, mapReady]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onCancel?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const finalizeWorking = () => {
    if (working.length < 3) return;
    if (mode === "zone") {
      setZone([...working]);
    } else {
      setExclusions((ex) => [...ex, [...working]]);
    }
    setWorking([]);
  };

  const canSave = zone.length >= 3;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-[760px] max-h-[92vh] overflow-auto">
        <div className="p-6">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{title}</h2>
              {description && <p className="text-sm text-slate-600 mt-1 leading-relaxed">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Draw mode toggle */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button
              type="button"
              onClick={() => setMode("zone")}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
                mode === "zone"
                  ? "bg-emerald-600 border-emerald-600 text-white"
                  : "bg-white border-slate-200 text-slate-600 hover:border-emerald-300"
              }`}
            >
              <MapPinned className="w-4 h-4" />
              Pickup zone
            </button>
            <button
              type="button"
              onClick={() => setMode("exclusion")}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
                mode === "exclusion"
                  ? "bg-rose-600 border-rose-600 text-white"
                  : "bg-white border-slate-200 text-slate-600 hover:border-rose-300"
              }`}
            >
              <Ban className="w-4 h-4" />
              Exclusion zone
            </button>
          </div>

          {/* Map */}
          <div className="rounded-xl overflow-hidden border border-slate-100 shadow-sm relative mt-4">
            <div ref={mapContainerRef} className="w-full h-[380px]" />
            {!mapReady && !mapError && (
              <div className="absolute inset-0 bg-slate-50 flex items-center justify-center gap-2.5 text-sm text-slate-500">
                <Loader2 size={18} className="animate-spin text-emerald-600" />
                Loading map...
              </div>
            )}
            {mapError && (
              <div className="absolute inset-0 bg-red-50 flex flex-col items-center justify-center gap-2 px-4 text-center">
                <AlertTriangle size={28} className="text-red-400" />
                <p className="text-sm font-medium text-red-600">Could not load map tiles</p>
                <p className="text-xs text-red-400">Check your internet connection and try again.</p>
              </div>
            )}
            <div className="px-4 py-2.5 text-xs text-slate-500 bg-slate-50/80 border-t border-slate-100 flex items-center gap-2">
              <PenTool size={12} className="text-emerald-500" />
              {mode === "zone"
                ? "Click on the map to trace the boundary of your pickup zone, then finalize the shape."
                : "Draw the area inside your zone where pickups are NOT available."}
            </div>
          </div>

          {/* In-progress stroke controls */}
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <span className="text-xs font-semibold text-slate-500">
              {working.length === 0
                ? "No points drawn yet"
                : `${working.length} point${working.length === 1 ? "" : "s"} drawn`}
            </span>
            {working.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => setWorking((v) => v.slice(0, -1))}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  Undo point
                </button>
                <button
                  type="button"
                  onClick={() => setWorking([])}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear draft
                </button>
                <button
                  type="button"
                  onClick={finalizeWorking}
                  disabled={working.length < 3}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    working.length < 3
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : mode === "zone"
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "bg-rose-600 text-white hover:bg-rose-700"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {mode === "zone" ? "Use as pickup zone" : "Add exclusion zone"}
                </button>
              </>
            )}
          </div>

          {/* Saved shapes summary */}
          <div className="space-y-2 mt-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-emerald-200 bg-emerald-50/60">
              <div className="flex items-center gap-2.5">
                <MapPinned className="w-4 h-4 text-emerald-600" />
                <div>
                  <p className="text-sm font-semibold text-emerald-900">Pickup zone</p>
                  <p className="text-xs text-emerald-700/70">
                    {zone.length >= 3
                      ? `Drawn (${zone.length} points) — customers inside this area can select pickup`
                      : "Not drawn yet — customers would match this area by name only"}
                  </p>
                </div>
              </div>
              {zone.length >= 3 && (
                <button
                  type="button"
                  onClick={() => setZone([])}
                  className="text-xs font-medium text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg px-2 py-1 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            {exclusions.length > 0 && (
              <div className="p-3 rounded-lg border border-rose-200 bg-rose-50/60">
                <p className="text-sm font-semibold text-rose-900 mb-2">Exclusion zones ({exclusions.length})</p>
                <div className="flex flex-wrap gap-2">
                  {exclusions.map((ex, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-rose-200 text-xs font-medium text-rose-700"
                    >
                      Zone {i + 1} ({ex.length} pts)
                      <button
                        type="button"
                        onClick={() => setExclusions((list) => list.filter((_, idx) => idx !== i))}
                        className="text-rose-400 hover:text-rose-700 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
            {mode === "exclusion" && exclusions.length === 0 && (
              <p className="text-xs text-slate-400">
                Tip: mark pedestrian-only streets or restricted zones inside your pickup area as exclusions.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave?.({ polygon: zone.length >= 3 ? zone.map(([lat, lng]) => [Number(lat.toFixed(6)), Number(lng.toFixed(6))]) : null, exclusions: exclusions.map((e) => e.map(([lat, lng]) => [Number(lat.toFixed(6)), Number(lng.toFixed(6))])) })}
            disabled={!canSave}
            className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              canSave ? "text-white bg-emerald-600 hover:bg-emerald-700" : "text-slate-400 bg-slate-100 cursor-not-allowed"
            }`}
          >
            Save zone
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Read-only polygon preview for product detail pages: renders one or more
 * pickup geoshapes (emerald) with their exclusion zones (rose).
 */
export function PickupGeoshapePreview({ areas = [], height = 260, className = "" }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const initializedRef = useRef(false);
  const mapReadyRef = useRef(false);
  const failTimerRef = useRef(null);
  const [failed, setFailed] = useState(false);

  const zones = areas.filter((a) => Array.isArray(a.polygon) && a.polygon.length >= 3);
  const exclusions = zones.flatMap((a) => (Array.isArray(a.exclusions) ? a.exclusions : []));

  useEffect(() => {
    if (!containerRef.current || initializedRef.current || zones.length === 0) return;
    initializedRef.current = true;

    let map;
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: TILE_STYLE,
        center: defaultCenter,
        zoom: 5,
      });
    } catch {
      // No WebGL / unsupported device → degrade to the error state instead
      // of crashing the product detail page.
      window.setTimeout(() => setFailed(true), 0);
      return;
    }

    map.on("load", () => {
      if (failTimerRef.current != null) {
        window.clearTimeout(failTimerRef.current);
        failTimerRef.current = null;
      }
      mapReadyRef.current = true;
      map.addSource("pv-zones", { type: "geojson", data: { type: "FeatureCollection", features: zones.map((a) => polygonFeature(a.polygon)) } });
      map.addLayer({ id: "pv-zones-fill", type: "fill", source: "pv-zones", paint: { "fill-color": ZONE_FILL } });
      map.addLayer({ id: "pv-zones-line", type: "line", source: "pv-zones", paint: { "line-color": ZONE_LINE, "line-width": 2 } });

      if (exclusions.length > 0) {
        map.addSource("pv-excl", { type: "geojson", data: { type: "FeatureCollection", features: exclusions.map((e) => polygonFeature(e)) } });
        map.addLayer({ id: "pv-excl-fill", type: "fill", source: "pv-excl", paint: { "fill-color": EXCL_FILL } });
        map.addLayer({ id: "pv-excl-line", type: "line", source: "pv-excl", paint: { "line-color": EXCL_LINE, "line-width": 2, "line-dasharray": [2, 1] } });
      }

      const bounds = new maplibregl.LngLatBounds();
      zones.forEach((a) => a.polygon.forEach(([lat, lng]) => bounds.extend([lng, lat])));
      exclusions.forEach((e) => e.forEach(([lat, lng]) => bounds.extend([lng, lat])));
      if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 40, maxZoom: 14.5 });
    });

    // Transient tile 404s are tolerated (overlays render over the blank
    // base); a failing style/server degrades after a grace period.
    map.on("error", () => {
      if (!mapReadyRef.current && failTimerRef.current == null) {
        failTimerRef.current = window.setTimeout(() => setFailed(true), 8000);
      }
    });

    mapRef.current = map;
    return () => {
      if (failTimerRef.current != null) {
        window.clearTimeout(failTimerRef.current);
        failTimerRef.current = null;
      }
      mapReadyRef.current = false;
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (zones.length === 0) return null;

  return (
    <div className={`rounded-xl overflow-hidden border border-slate-200 relative ${className}`}>
      <div ref={containerRef} style={{ height }} className="w-full" />
      {failed && (
        <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center gap-2 text-sm text-red-500">
          <AlertTriangle size={16} className="text-red-400" />
          Could not load map
        </div>
      )}
      <div className="px-3 py-2 text-[11px] text-slate-500 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between">
        <span>Pickup zone — drawn service area (green) and exclusions (red)</span>
        {exclusions.length > 0 && (
          <span className="font-semibold text-rose-500">{exclusions.length} exclusion zone{exclusions.length === 1 ? "" : "s"}</span>
        )}
      </div>
    </div>
  );
}