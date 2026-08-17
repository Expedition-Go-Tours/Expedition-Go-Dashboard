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
  Circle,
  Triangle,
  Square,
  RectangleHorizontal,
  MousePointer2,
  Eye,
  EyeOff,
} from "lucide-react";
import LocationAutocomplete from "@/components/shared/LocationAutocomplete";
import {
  rectFromCorners,
  squareFromCenter,
  circleFromCenter,
  triangleFromCenter,
  distanceMeters,
  pointInPolygon,
  polygonExtentMeters,
  resolvePickupVerdict,
  VERDICTS,
} from "@/lib/pickupShapeTools";

const defaultCenter = { lng: -0.187, lat: 5.6037 };
const TILE_STYLE = "https://tiles.openfreemap.org/styles/liberty";

const ZONE_FILL = "rgba(5, 150, 105, 0.22)";
const ZONE_LINE = "#047857";
const EXCL_FILL = "rgba(225, 29, 72, 0.18)";
const EXCL_LINE = "#e11d48";

const CLOSE_HIT_PX = 15;
const VERTEX_HIT_PX = 12;
const MIN_EXTENT_M = 5;
const MIN_RADIUS_M = 10;

const VERDICT_COLOR = {
  [VERDICTS.INSIDE]: "#047857",
  [VERDICTS.EXCLUDED]: "#e11d48",
  [VERDICTS.OUTSIDE]: "#64748b",
  [VERDICTS.NO_ZONE]: "#94a3b8",
};

const SHAPE_TOOLS = [
  { id: "rect", label: "Rect", Icon: RectangleHorizontal, factory: rectFromCorners, radial: false },
  { id: "square", label: "Square", Icon: Square, factory: squareFromCenter, radial: true },
  { id: "circle", label: "Circle", Icon: Circle, factory: circleFromCenter, radial: true },
  { id: "triangle", label: "Triangle", Icon: Triangle, factory: triangleFromCenter, radial: true },
];

function polygonFeature(coordinates) {
  return {
    type: "Feature",
    properties: {},
    geometry: { type: "Polygon", coordinates: [coordinates] },
  };
}

function pointFeature(lng, lat) {
  return { type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [lng, lat] } };
}

function emptyCollection() {
  return { type: "FeatureCollection", features: [] };
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

function ghostEdgeFeatures(vertices, hover) {
  if (!hover || vertices.length < 2) return emptyCollection();
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: [
            [vertices[vertices.length - 1][1], vertices[vertices.length - 1][0]],
            [hover.lng, hover.lat],
          ],
        },
      },
    ],
  };
}

/**
 * MapLibre GL polygon drawing tool for pickup geoshapes (service zone +
 * optional exclusion zones), matching GetYourGuide's pickup tool: freehand
 * tracing with ghost edge + auto-close, preset shapes (rect, square, circle,
 * triangle) placed by click + drag-to-size, vertex/body editing, and a
 * customer-view preview that resolves an address against the drawn zones.
 */
export default function PickupGeoshapeDrawer({
  title = "Draw pickup zone",
  description,
  initialZone,
  initialExclusions,
  onSave,
  onCancel,
}) {
  const [zone, setZone] = useState(() => (Array.isArray(initialZone) && initialZone.length >= 3 ? initialZone.map((v) => [...v]) : []));
  const [exclusions, setExclusions] = useState(() => (Array.isArray(initialExclusions) ? initialExclusions.map((e) => [...e]) : []));
  const [working, setWorking] = useState([]);
  const [mode, setMode] = useState("zone");
  const [tool, setTool] = useState("freehand");
  const [editing, setEditing] = useState(null);
  const [shapeAnchor, setShapeAnchor] = useState(null);
  const [shapeCursor, setShapeCursor] = useState(null);
  const [hoverPos, setHoverPos] = useState(null);
  const [preview, setPreview] = useState(false);
  const [previewPoint, setPreviewPoint] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const initializedRef = useRef(false);
  const mapReadyRef = useRef(false);
  const failTimerRef = useRef(null);
  const workingRef = useRef(working);
  const modeRef = useRef(mode);
  const toolRef = useRef(tool);
  const editingRef = useRef(editing);
  const zoneRef = useRef(zone);
  const exclusionsRef = useRef(exclusions);
  const previewRef = useRef(preview);
  const shapeAnchorRef = useRef(null);
  const shapeCursorRef = useRef(null);
  const dragRef = useRef(null);
  const draggedRef = useRef(false);
  const lastClickRef = useRef(null);
  const handlersRef = useRef({});

  useEffect(() => {
    workingRef.current = working;
    modeRef.current = mode;
    toolRef.current = tool;
    editingRef.current = editing;
    zoneRef.current = zone;
    exclusionsRef.current = exclusions;
    previewRef.current = preview;
  });

  const finalizeWorking = useCallback(() => {
    const w = workingRef.current;
    if (!w || w.length < 3) return;
    const snapshot = w.map((v) => [...v]);
    setWorking([]);
    if (modeRef.current === "zone") {
      setZone(snapshot);
    } else {
      setExclusions((ex) => [...ex, snapshot]);
    }
  }, []);

  const cancelShapeDrag = useCallback(() => {
    shapeAnchorRef.current = null;
    shapeCursorRef.current = null;
    setShapeAnchor(null);
    setShapeCursor(null);
  }, []);

  const shapePolygon = useCallback((toolId, anchor, cursor) => {
    const def = SHAPE_TOOLS.find((s) => s.id === toolId);
    if (!def || !anchor || !cursor) return null;
    const a = [anchor.lat, anchor.lng];
    const c = [cursor.lat, cursor.lng];
    if (def.radial) {
      const radius = distanceMeters(a, c);
      if (radius < MIN_RADIUS_M) return null;
      return def.factory(a, radius);
    }
    const poly = def.factory(a, c);
    const extent = polygonExtentMeters(poly);
    if (!extent || extent.width < MIN_EXTENT_M || extent.height < MIN_EXTENT_M) return null;
    return poly;
  }, []);

  const commitShapeDrag = useCallback(() => {
    const anchor = shapeAnchorRef.current;
    const cursor = shapeCursorRef.current;
    cancelShapeDrag();
    if (!anchor || !cursor) return;
    const poly = shapePolygon(toolRef.current, anchor, cursor);
    if (!poly) return;
    if (modeRef.current === "zone") {
      setZone(poly);
    } else {
      setExclusions((ex) => [...ex, poly]);
    }
  }, [cancelShapeDrag, shapePolygon]);

  const commitVertsToState = useCallback((shape, verts) => {
    if (shape.kind === "zone") {
      setZone(verts.map((v) => [...v]));
    } else {
      setExclusions((list) => list.map((ex, i) => (i === shape.index ? verts.map((v) => [...v]) : ex)));
    }
  }, []);

  const getShapeVerts = useCallback((shape) => {
    if (!shape) return null;
    if (shape.kind === "zone") return zoneRef.current;
    return exclusionsRef.current[shape.index] || null;
  }, []);

  const sameShape = useCallback((a, b) => {
    if (a === b) return true;
    return !!a && !!b && a.kind === b.kind && a.index === b.index;
  }, []);

  const findShapeVertex = useCallback(
    (point) => {
      const map = mapRef.current;
      if (!map) return null;
      const scan = (verts, shape) => {
        if (!verts) return null;
        for (let i = 0; i < verts.length; i += 1) {
          const p = map.project([verts[i][1], verts[i][0]]);
          if (Math.hypot(p.x - point.x, p.y - point.y) <= VERTEX_HIT_PX) return { shape, vertexIndex: i };
        }
        return null;
      };
      for (let i = exclusionsRef.current.length - 1; i >= 0; i -= 1) {
        const hit = scan(exclusionsRef.current[i], { kind: "exclusion", index: i });
        if (hit) return hit;
      }
      return scan(zoneRef.current, { kind: "zone", index: 0 });
    },
    []
  );

  const findShapeAt = useCallback(
    (e) => {
      const vertexHit = findShapeVertex(e.point);
      if (vertexHit) return vertexHit;
      const point = [e.lngLat.lat, e.lngLat.lng];
      for (let i = exclusionsRef.current.length - 1; i >= 0; i -= 1) {
        if (pointInPolygon(point, exclusionsRef.current[i])) {
          return { shape: { kind: "exclusion", index: i }, vertexIndex: null };
        }
      }
      if (pointInPolygon(point, zoneRef.current)) {
        return { shape: { kind: "zone", index: 0 }, vertexIndex: null };
      }
      return null;
    },
    [findShapeVertex]
  );

  const updateCursor = useCallback(
    (e) => {
      const map = mapRef.current;
      if (!map) return;
      if (previewRef.current) {
        map.getCanvas().style.cursor = "pointer";
        return;
      }
      if (toolRef.current === "edit") {
        const hit = findShapeVertex(e.point);
        if (hit) {
          map.getCanvas().style.cursor = "pointer";
          return;
        }
        map.getCanvas().style.cursor = findShapeAt(e) ? "move" : "default";
        return;
      }
      map.getCanvas().style.cursor = "crosshair";
    },
    [findShapeAt, findShapeVertex]
  );

  useEffect(() => {
    handlersRef.current = {
      onClick(e) {
        if (previewRef.current) {
          setPreviewPoint({ lat: e.lngLat.lat, lng: e.lngLat.lng });
          return;
        }
        if (toolRef.current === "edit") {
          if (!editingRef.current || draggedRef.current) return;
          const hit = findShapeVertex(e.point);
          if (!hit || !sameShape(hit.shape, editingRef.current) || hit.vertexIndex == null) return;
          const verts = getShapeVerts(hit.shape);
          if (!verts || verts.length <= 3) return;
          if (hit.shape.kind === "zone") {
            setZone((v) => v.filter((_, i) => i !== hit.vertexIndex));
          } else {
            setExclusions((list) => list.map((ex, i) => (i === hit.shape.index ? ex.filter((_, j) => j !== hit.vertexIndex) : ex)));
          }
          return;
        }
        if (toolRef.current !== "freehand") return;
        const w = workingRef.current;
        const map = mapRef.current;
        if (w.length >= 3) {
          const first = map.project([w[0][1], w[0][0]]);
          if (first && Math.hypot(first.x - e.point.x, first.y - e.point.y) <= CLOSE_HIT_PX) {
            finalizeWorking();
            return;
          }
        }
        const last = lastClickRef.current;
        const now = Date.now();
        if (last && now - last.t < 300 && Math.hypot(last.x - e.point.x, last.y - e.point.y) <= 6) return;
        lastClickRef.current = { t: now, x: e.point.x, y: e.point.y };
        setWorking((v) => [...v, [e.lngLat.lat, e.lngLat.lng]]);
      },
      onDblClick() {
        if (toolRef.current !== "freehand" || previewRef.current || editingRef.current) return;
        finalizeWorking();
      },
      onMouseDown(e) {
        if (e.originalEvent?.button !== 0) return;
        const map = mapRef.current;
        if (!map) return;
        draggedRef.current = false;
        if (previewRef.current) return;
        if (toolRef.current === "edit") {
          const hit = findShapeAt(e);
          if (!hit) {
            setEditing(null);
            return;
          }
          if (sameShape(hit.shape, editingRef.current)) {
            const verts = getShapeVerts(hit.shape);
            if (!verts) return;
            dragRef.current =
              hit.vertexIndex != null
                ? {
                    kind: "vertex",
                    shape: hit.shape,
                    vertexIndex: hit.vertexIndex,
                    lastLat: e.lngLat.lat,
                    lastLng: e.lngLat.lng,
                    verts: verts.map((v) => [...v]),
                  }
                : {
                    kind: "move",
                    shape: hit.shape,
                    startLat: e.lngLat.lat,
                    startLng: e.lngLat.lng,
                    verts: verts.map((v) => [...v]),
                    origVerts: verts.map((v) => [...v]),
                  };
            map.dragPan.disable();
            map.getCanvas().style.cursor = "grabbing";
          } else {
            setEditing(hit.shape);
          }
          return;
        }
        if (toolRef.current !== "freehand") {
          shapeAnchorRef.current = { lat: e.lngLat.lat, lng: e.lngLat.lng };
          shapeCursorRef.current = { lat: e.lngLat.lat, lng: e.lngLat.lng };
          setShapeAnchor(shapeAnchorRef.current);
          setShapeCursor(shapeCursorRef.current);
          map.dragPan.disable();
        }
      },
      onMouseMove(e) {
        if (dragRef.current) {
          const d = dragRef.current;
          draggedRef.current = true;
          if (d.kind === "vertex") {
            const dLat = e.lngLat.lat - d.lastLat;
            const dLng = e.lngLat.lng - d.lastLng;
            d.lastLat = e.lngLat.lat;
            d.lastLng = e.lngLat.lng;
            d.verts[d.vertexIndex] = [d.verts[d.vertexIndex][0] + dLat, d.verts[d.vertexIndex][1] + dLng];
          } else {
            const dLat = e.lngLat.lat - d.startLat;
            const dLng = e.lngLat.lng - d.startLng;
            d.verts = d.origVerts.map(([lat, lng]) => [lat + dLat, lng + dLng]);
          }
          commitVertsToState(d.shape, d.verts);
          return;
        }
        if (shapeAnchorRef.current && toolRef.current !== "freehand") {
          shapeCursorRef.current = { lat: e.lngLat.lat, lng: e.lngLat.lng };
          setShapeCursor(shapeCursorRef.current);
          return;
        }
        if (toolRef.current === "freehand" && workingRef.current.length > 0 && !previewRef.current) {
          setHoverPos({ lat: e.lngLat.lat, lng: e.lngLat.lng });
        }
        updateCursor(e);
      },
      onMouseLeave() {
        setHoverPos(null);
      },
      onMouseUp() {
        if (dragRef.current) {
          dragRef.current = null;
          const map = mapRef.current;
          if (map) map.getCanvas().style.cursor = editingRef.current ? "default" : "crosshair";
        }
        if (shapeAnchorRef.current && toolRef.current !== "freehand") {
          commitShapeDrag();
          const map = mapRef.current;
          if (map) map.getCanvas().style.cursor = "crosshair";
        }
      },
    };
  }, [commitShapeDrag, commitVertsToState, finalizeWorking, findShapeAt, findShapeVertex, getShapeVerts, sameShape, updateCursor]);

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
      map.doubleClickZoom.disable();

      map.addSource("gz-zone", { type: "geojson", data: polygonFeature(zoneRef.current) });
      map.addLayer({ id: "gz-zone-fill", type: "fill", source: "gz-zone", paint: { "fill-color": ZONE_FILL } });
      map.addLayer({ id: "gz-zone-line", type: "line", source: "gz-zone", paint: { "line-color": ZONE_LINE, "line-width": 2 } });

      map.addSource("gz-excl", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: exclusionsRef.current.map((e) => polygonFeature(e)),
        },
      });
      map.addLayer({ id: "gz-excl-fill", type: "fill", source: "gz-excl", paint: { "fill-color": EXCL_FILL } });
      map.addLayer({ id: "gz-excl-line", type: "line", source: "gz-excl", paint: { "line-color": EXCL_LINE, "line-width": 2, "line-dasharray": [2, 1] } });

      map.addSource("gz-working", { type: "geojson", data: workingFeatures(workingRef.current) });
      map.addLayer({ id: "gz-working-line", type: "line", source: "gz-working", paint: { "line-color": "#0ea5e9", "line-width": 2 } });
      map.addLayer({ id: "gz-working-pts", type: "circle", source: "gz-working", paint: { "circle-radius": 5, "circle-color": "#0284c7", "circle-stroke-color": "#fff", "circle-stroke-width": 2 } });

      map.addSource("gz-working-ghost", { type: "geojson", data: emptyCollection() });
      map.addLayer({ id: "gz-working-ghost-line", type: "line", source: "gz-working-ghost", paint: { "line-color": "#0ea5e9", "line-width": 2, "line-dasharray": [2, 2] } });

      map.addSource("gz-working-first", { type: "geojson", data: emptyCollection() });
      map.addLayer({ id: "gz-working-first-ring", type: "circle", source: "gz-working-first", paint: { "circle-radius": 8, "circle-color": "#0284c7", "circle-stroke-color": "#fff", "circle-stroke-width": 2.5 } });

      map.addSource("gz-shape-preview", { type: "geojson", data: emptyCollection() });
      map.addLayer({ id: "gz-shape-preview-fill", type: "fill", source: "gz-shape-preview", paint: { "fill-color": "rgba(14, 165, 233, 0.2)" } });
      map.addLayer({ id: "gz-shape-preview-line", type: "line", source: "gz-shape-preview", paint: { "line-color": "#0284c7", "line-width": 2, "line-dasharray": [3, 2] } });

      map.addSource("gz-preview-marker", { type: "geojson", data: emptyCollection() });
      map.addLayer({ id: "gz-preview-marker-dot", type: "circle", source: "gz-preview-marker", paint: { "circle-radius": 9, "circle-color": "#64748b", "circle-stroke-color": "#fff", "circle-stroke-width": 3 } });

      map.getCanvas().style.cursor = "crosshair";

      if (zoneRef.current.length >= 3) {
        const bounds = new maplibregl.LngLatBounds();
        zoneRef.current.forEach(([lat, lng]) => bounds.extend([lng, lat]));
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
    const canvas = map.getCanvas();
    const onCanvasLeave = () => handlersRef.current.onMouseLeave();
    canvas.addEventListener("mouseleave", onCanvasLeave);

    map.on("click", (e) => handlersRef.current.onClick(e));
    map.on("dblclick", (e) => handlersRef.current.onDblClick(e));
    map.on("mousedown", (e) => handlersRef.current.onMouseDown(e));
    map.on("mousemove", (e) => handlersRef.current.onMouseMove(e));
    const onWindowMouseUp = () => handlersRef.current.onMouseUp();
    window.addEventListener("mouseup", onWindowMouseUp);

    mapRef.current = map;
    return () => {
      if (failTimerRef.current != null) {
        window.clearTimeout(failTimerRef.current);
        failTimerRef.current = null;
      }
      canvas.removeEventListener("mouseleave", onCanvasLeave);
      window.removeEventListener("mouseup", onWindowMouseUp);
      mapReadyRef.current = false;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  function polygonFeatureForExclusions(list) {
    return { type: "FeatureCollection", features: list.map((e) => polygonFeature(e)) };
  }

  // Live-update sources when shapes change.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const ensure = (id, data) => {
      if (map.getSource(id)) map.getSource(id).setData(data);
    };
    ensure("gz-zone", polygonFeature(zone));
    ensure("gz-excl", zone.length === 0 && exclusions.length === 0 ? emptyCollection() : polygonFeatureForExclusions(exclusions));
  }, [zone, exclusions, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const ensure = (id, data) => {
      if (map.getSource(id)) map.getSource(id).setData(data);
    };
    ensure("gz-working", workingFeatures(working));
    ensure("gz-working-ghost", tool === "freehand" && working.length >= 2 && hoverPos && !shapeAnchor ? ghostEdgeFeatures(working, hoverPos) : emptyCollection());
    ensure(
      "gz-working-first",
      tool === "freehand" && working.length >= 3
        ? { type: "FeatureCollection", features: [pointFeature(working[0][1], working[0][0])] }
        : emptyCollection()
    );
  }, [working, hoverPos, tool, shapeAnchor, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const poly = tool !== "freehand" && shapeAnchor && shapeCursor ? shapePolygon(tool, shapeAnchor, shapeCursor) : null;
    const data = poly ? polygonFeature(poly) : emptyCollection();
    if (map.getSource("gz-shape-preview")) map.getSource("gz-shape-preview").setData(data);
  }, [tool, shapeAnchor, shapeCursor, shapePolygon, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    if (map.getSource("gz-preview-marker")) {
      map
        .getSource("gz-preview-marker")
        .setData(previewPoint ? { type: "FeatureCollection", features: [pointFeature(previewPoint.lng, previewPoint.lat)] } : emptyCollection());
    }
    const verdict = previewPoint ? resolvePickupVerdict(zone, exclusions, [previewPoint.lat, previewPoint.lng]) : null;
    if (verdict && map.getLayer("gz-preview-marker-dot")) {
      map.setPaintProperty("gz-preview-marker-dot", "circle-color", VERDICT_COLOR[verdict]);
    }
  }, [previewPoint, zone, exclusions, mapReady]);

  // Pan lock while drafting, sizing a shape, or editing a saved shape.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const locked = working.length > 0 || shapeAnchor || editing;
    if (locked) map.dragPan.disable();
    else map.dragPan.enable();
  }, [working.length, shapeAnchor, editing, mapReady]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "Enter") {
        if (previewRef.current || editingRef.current || toolRef.current !== "freehand") return;
        finalizeWorking();
        return;
      }
      if (e.key === "Escape") {
        if (editingRef.current) {
          setEditing(null);
        } else if (shapeAnchorRef.current) {
          cancelShapeDrag();
        } else if (workingRef.current.length > 0) {
          setWorking([]);
        } else {
          onCancel?.();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cancelShapeDrag, finalizeWorking, onCancel]);

  const selectTool = (t) => {
    setTool(t);
    setWorking([]);
    setHoverPos(null);
    cancelShapeDrag();
    if (t !== "edit") setEditing(null);
  };

  const togglePreview = () => {
    setPreview((p) => {
      const next = !p;
      if (next) {
        setWorking([]);
        setHoverPos(null);
        cancelShapeDrag();
        setEditing(null);
      }
      return next;
    });
  };

  const handleLocationSelect = (result) => {
    if (!result?.latitude || !result?.longitude) return;
    const point = { lat: result.latitude, lng: result.longitude };
    mapRef.current?.flyTo({ center: [point.lng, point.lat], zoom: 12, duration: 800 });
    if (previewRef.current) setPreviewPoint(point);
  };  const canPreview = zone.length >= 3 || exclusions.length > 0;
  const verdict = previewPoint ? resolvePickupVerdict(zone, exclusions, [previewPoint.lat, previewPoint.lng]) : null;
  const hintText = preview
    ? "Customer view — search an address or click the map to check pickup availability."
    : tool === "edit"
      ? "Drag a vertex to resize, drag inside a shape to move it, click a vertex to delete it, click outside to stop editing."
      : tool === "freehand"
        ? mode === "zone"
          ? "Click to trace your pickup zone. Click the first point again (or double-click / press Enter) to close the shape."
          : "Draw the area inside your zone where pickups are NOT available. Click the first point again to close."
        : "Click to anchor the shape, then drag to size it and release to place it.";

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

          {!preview && (
            <>
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

              {/* Shape tools */}
              <div className="grid grid-cols-6 gap-1.5 mt-3">
                <button
                  type="button"
                  onClick={() => selectTool("freehand")}
                  title="Trace a freehand boundary"
                  className={`flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg text-[11px] font-semibold border transition-colors ${
                    tool === "freehand"
                      ? "bg-sky-600 border-sky-600 text-white"
                      : "bg-white border-slate-200 text-slate-500 hover:border-sky-300"
                  }`}
                >
                  <PenTool className="w-4 h-4" />
                  Freehand
                </button>
                {SHAPE_TOOLS.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => selectTool(id)}
                    title={`Place a ${label.toLowerCase()} shape`}
                    className={`flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg text-[11px] font-semibold border transition-colors ${
                      tool === id
                        ? "bg-sky-600 border-sky-600 text-white"
                        : "bg-white border-slate-200 text-slate-500 hover:border-sky-300"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => selectTool("edit")}
                  title="Edit saved shapes: resize, move, delete vertices"
                  className={`flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg text-[11px] font-semibold border transition-colors ${
                    tool === "edit"
                      ? "bg-slate-800 border-slate-800 text-white"
                      : "bg-white border-slate-200 text-slate-500 hover:border-slate-400"
                  }`}
                >
                  <MousePointer2 className="w-4 h-4" />
                  Edit
                </button>
              </div>

              {/* Location search */}
              <div className="mt-3">
                <LocationAutocomplete
                  hideLabel
                  placeholder="Search a location to focus the map (e.g., Osu, Accra)"
                  minChars={2}
                  clearOnSelect
                  onSelect={handleLocationSelect}
                />
              </div>
            </>
          )}

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
            {preview && previewPoint && verdict && (
              <div
                className="absolute top-3 right-3 z-10 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm text-white"
                style={{ backgroundColor: VERDICT_COLOR[verdict] }}
              >
                <MapPinned className="w-3.5 h-3.5" />
                {verdict === VERDICTS.INSIDE && "Pickup available in this area"}
                {verdict === VERDICTS.EXCLUDED && "Pickup unavailable — inside an exclusion zone"}
                {verdict === VERDICTS.OUTSIDE && "Outside your pickup area — pickup unavailable"}
                {verdict === VERDICTS.NO_ZONE && "Draw a pickup zone first"}
              </div>
            )}
            <div className="px-4 py-2.5 text-xs text-slate-500 bg-slate-50/80 border-t border-slate-100 flex items-center gap-2">
              <PenTool size={12} className="shrink-0" />
              <span>{hintText}</span>
              {tool === "freehand" && working.length > 0 && !preview && (
                <span className="ml-auto shrink-0 font-semibold text-slate-400">
                  {working.length} point{working.length === 1 ? "" : "s"}
                </span>
              )}
            </div>
          </div>

          {/* In-progress freehand controls */}
          {!preview && tool === "freehand" && (
            <div className="flex flex-wrap items-center gap-3 mt-4">
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
                    onClick={() => {
                      setWorking([]);
                      setHoverPos(null);
                    }}
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
              <span className="text-xs font-semibold text-slate-500">
                {working.length === 0
                  ? "No points drawn yet"
                  : `${working.length} point${working.length === 1 ? "" : "s"} drawn`}
              </span>
            </div>
          )}

          {!preview && tool === "edit" && (
            <p className="text-xs text-slate-400 mt-4">
              Tip: click a saved shape to select it, then drag its vertices to resize, drag inside to move it, or click a vertex to delete it.
            </p>
          )}

          {/* Saved shapes summary */}
          {!preview && (
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
          )}
        </div>

        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100">
          <button
            type="button"
            onClick={togglePreview}
            disabled={!canPreview}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              canPreview
                ? preview
                  ? "text-slate-600 hover:bg-slate-100"
                  : "text-emerald-600 hover:bg-emerald-50"
                : "text-slate-300 cursor-not-allowed"
            }`}
          >
            {preview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {preview ? "Back to editing" : "Preview customer view"}
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() =>
                onSave?.({
                  polygon: zone.length >= 3 ? zone.map(([lat, lng]) => [Number(lat.toFixed(6)), Number(lng.toFixed(6))]) : null,
                  exclusions: exclusions.map((e) => e.map(([lat, lng]) => [Number(lat.toFixed(6)), Number(lng.toFixed(6))])),
                })
              }
              disabled={zone.length < 3}
              className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                zone.length >= 3 ? "text-white bg-emerald-600 hover:bg-emerald-700" : "text-slate-400 bg-slate-100 cursor-not-allowed"
              }`}
            >
              Save zone
            </button>
          </div>
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
