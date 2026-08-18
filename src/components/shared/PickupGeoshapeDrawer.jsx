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
  triangleFromCenter,
  distanceMeters,
  pointInPolygon,
  polygonExtentMeters,
  polygonFeature,
  polygonAreaKm2,
  polygonPerimeterKm,
  resolvePickupVerdict,
  VERDICTS,
} from "@/lib/pickupShapeTools";
import {
  edgeMidpoint,
  nudgeVertex,
  translateShape,
  clampLatLng,
  beginEdgeDrag,
  deleteVertex,
  nearestEditHandle,
} from "@/lib/pickupShapeEdit";
import { DEFAULT_CENTER, TILE_STYLE, warmMapResources, cameraFromGeoshape } from "@/lib/mapConfig";

const ZONE_FILL = "rgba(5, 150, 105, 0.22)";
const ZONE_LINE = "#047857";
const EXCL_FILL = "rgba(225, 29, 72, 0.18)";
const EXCL_LINE = "#e11d48";

const CLOSE_HIT_PX = 15;
const VERTEX_HIT_PX = 12;
const EDGE_HIT_PX = 10;
const MIN_EXTENT_M = 5;
const MIN_RADIUS_M = 10;

const VERDICT_COLOR = {
  [VERDICTS.INSIDE]: "#047857",
  [VERDICTS.EXCLUDED]: "#e11d48",
  [VERDICTS.OUTSIDE]: "#64748b",
  [VERDICTS.NO_ZONE]: "#94a3b8",
};

// Compact, human-readable zone metrics for the saved-shape summary.
function formatAreaKm2(km2) {
  if (km2 >= 100) return `${Math.round(km2).toLocaleString()} km²`;
  if (km2 >= 10) return `${km2.toFixed(1)} km²`;
  if (km2 >= 1) return `${km2.toFixed(2)} km²`;
  return `${Math.round(km2 * 1000)} m²`;
}

function formatPerimeterKm(km) {
  if (km >= 10) return `${Math.round(km).toLocaleString()} km`;
  return `${km.toFixed(1)} km`;
}

const SHAPE_TOOLS = [
  { id: "rect", label: "Rect", Icon: RectangleHorizontal, factory: rectFromCorners, radial: false },
  { id: "square", label: "Square", Icon: Square, factory: squareFromCenter, radial: true },
  { id: "triangle", label: "Triangle", Icon: Triangle, factory: triangleFromCenter, radial: true },
];

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
  open = true,
  title = "Draw pickup zone",
  description,
  initialZone,
  initialExclusions,
  initialLocation,
  onSave,
  onCancel,
}) {
  const [zone, setZone] = useState(() => (Array.isArray(initialZone) && initialZone.length >= 3 ? initialZone.map((v) => [...v]) : []));
  const [exclusions, setExclusions] = useState(() => (Array.isArray(initialExclusions) ? initialExclusions.map((e) => [...e]) : []));
  const [location, setLocation] = useState(() => (initialLocation && initialLocation.lat != null ? { ...initialLocation } : null));
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
  const [tilesLoading, setTilesLoading] = useState(false);

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
  const pointerDownRef = useRef(null);
  const lastTapRef = useRef(null);
  const handlersRef = useRef({});
  const pendingMoveRef = useRef(null);
  const rafRef = useRef(null);
  const projectedRef = useRef({ verts: [], mids: [] });
  const openRef = useRef(open);
  const canvasListenersRef = useRef(null);

  useEffect(() => {
    workingRef.current = working;
    modeRef.current = mode;
    toolRef.current = tool;
    editingRef.current = editing;
    zoneRef.current = zone;
    exclusionsRef.current = exclusions;
    previewRef.current = preview;
    openRef.current = open;
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

  const removeVertexAt = useCallback((shape, index) => {
    if (!shape) return;
    if (shape.kind === "zone") {
      setZone((v) => (v.length > 3 ? deleteVertex(v, index) : v));
    } else {
      setExclusions((list) =>
        list.map((ex, i) => (i === shape.index ? (ex.length > 3 ? deleteVertex(ex, index) : ex) : ex))
      );
    }
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
    (point, lngLat) => {
      const vertexHit = findShapeVertex(point);
      if (vertexHit) return vertexHit;
      const pt = [lngLat.lat, lngLat.lng];
      for (let i = exclusionsRef.current.length - 1; i >= 0; i -= 1) {
        if (pointInPolygon(pt, exclusionsRef.current[i])) {
          return { shape: { kind: "exclusion", index: i }, vertexIndex: null };
        }
      }
      if (pointInPolygon(pt, zoneRef.current)) {
        return { shape: { kind: "zone", index: 0 }, vertexIndex: null };
      }
      return null;
    },
    [findShapeVertex]
  );

  // Cache screen-space positions of the selected shape's corners + edge
  // midpoints so pointer hit-testing stays O(1) during drags instead of
  // projecting every vertex on every pointermove.
  const refreshProjectedHandles = useCallback(() => {
    const map = mapRef.current;
    const shape = editingRef.current;
    projectedRef.current = { verts: [], mids: [] };
    if (!map || !shape) return;
    const verts = getShapeVerts(shape);
    if (!verts || verts.length === 0) return;
    const vertPts = [];
    const midPts = [];
    for (let i = 0; i < verts.length; i += 1) {
      const vp = map.project([verts[i][1], verts[i][0]]);
      vertPts.push({ x: vp.x, y: vp.y });
      const mid = edgeMidpoint(verts, i);
      const mp = map.project([mid[1], mid[0]]);
      midPts.push({ x: mp.x, y: mp.y });
    }
    projectedRef.current = { verts: vertPts, mids: midPts };
  }, [getShapeVerts]);

  // Hit-test the selected shape's handles. The NEAREST handle within its hit
  // radius wins (not "corners always first"), so edge dots stay grabbable on
  // dense shapes where midpoints sit close to corners.
  const findEditHandle = useCallback((point) => {
    const shape = editingRef.current;
    if (!shape) return null;
    const hit = nearestEditHandle(projectedRef.current, point, { vertex: VERTEX_HIT_PX, mid: EDGE_HIT_PX });
    if (!hit) return null;
    return hit.kind === "vertex"
      ? { kind: "vertex", shape, vertexIndex: hit.index }
      : { kind: "mid", shape, edgeIndex: hit.index };
  }, []);

  const updateCursor = useCallback(
    (point, lngLat) => {
      const map = mapRef.current;
      if (!map) return;
      if (previewRef.current) {
        map.getCanvas().style.cursor = "pointer";
        return;
      }
      // Handles are live whenever a shape is selected, even if the active
      // tool is still a shape tool (right after a preset is placed).
      if (editingRef.current && findEditHandle(point)) {
        map.getCanvas().style.cursor = "pointer";
        return;
      }
      if (toolRef.current === "edit") {
        if (findEditHandle(point)) {
          map.getCanvas().style.cursor = "pointer";
          return;
        }
        const hit = findShapeVertex(point);
        if (hit) {
          map.getCanvas().style.cursor = "pointer";
          return;
        }
        map.getCanvas().style.cursor = findShapeAt(point, lngLat) ? "move" : "default";
        return;
      }
      map.getCanvas().style.cursor = "crosshair";
    },
    [findShapeAt, findShapeVertex, findEditHandle]
  );

  const canvasPoint = useCallback((clientX, clientY) => {
    const canvas = mapRef.current?.getCanvas();
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }, []);

  // Apply one pointermove worth of work, batched to once per frame so heavy
  // shapes (e.g. a 32-vertex circle) never trigger a React render per event.
  const processMove = useCallback(
    (e) => {
      const map = mapRef.current;
      const pt = canvasPoint(e.clientX, e.clientY);
      if (!map || !pt) return;
      const lngLat = map.unproject(pt);
      const down = pointerDownRef.current;
      if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) down.moved = true;
      if (dragRef.current) {
        const d = dragRef.current;
        if (d.kind === "edge" && !d.inserted) {
          const { vertices, insertedIndex } = beginEdgeDrag(d.origVerts, d.edgeIndex);
          d.origVerts = vertices;
          d.vertexIndex = insertedIndex;
          d.inserted = true;
        }
        const dLat = lngLat.lat - d.baseLat;
        const dLng = lngLat.lng - d.baseLng;
        const next =
          d.kind === "move"
            ? translateShape(d.origVerts, dLat, dLng)
            : nudgeVertex(d.origVerts, d.vertexIndex, dLat, dLng);
        d.verts = next.map(clampLatLng);
        commitVertsToState(d.shape, d.verts);
        return;
      }
      if (shapeAnchorRef.current && toolRef.current !== "freehand") {
        shapeCursorRef.current = { lat: lngLat.lat, lng: lngLat.lng };
        setShapeCursor(shapeCursorRef.current);
        return;
      }
      if (toolRef.current === "freehand" && workingRef.current.length > 0 && !previewRef.current) {
        setHoverPos({ lat: lngLat.lat, lng: lngLat.lng });
      }
      updateCursor(pt, lngLat);
    },
    [canvasPoint, commitVertsToState, updateCursor]
  );

  const scheduleMove = useCallback(
    (e) => {
      pendingMoveRef.current = e;
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const ev = pendingMoveRef.current;
        pendingMoveRef.current = null;
        if (ev) processMove(ev);
      });
    },
    [processMove]
  );

  // Apply any not-yet-rendered move synchronously (e.g. before pointerup),
  // so the final drag position is never dropped.
  const flushPendingMove = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const ev = pendingMoveRef.current;
    pendingMoveRef.current = null;
    if (ev) processMove(ev);
  }, [processMove]);

  useEffect(() => {
    // Grab a corner or edge handle and start reshaping it (vertex = drag the
    // point, edge = insert a new midpoint vertex and drag it, Google Maps
    // style).
    const beginHandleDrag = (map, editHit, lngLat, pointerId) => {
      const verts = getShapeVerts(editHit.shape);
      if (!verts) return;
      setEditing(editHit.shape);
      dragRef.current =
        editHit.kind === "vertex"
          ? {
              kind: "vertex",
              shape: editHit.shape,
              vertexIndex: editHit.vertexIndex,
              baseLat: lngLat.lat,
              baseLng: lngLat.lng,
              origVerts: verts.map((v) => [...v]),
              inserted: false,
            }
          : {
              kind: "edge",
              shape: editHit.shape,
              edgeIndex: editHit.edgeIndex,
              baseLat: lngLat.lat,
              baseLng: lngLat.lng,
              origVerts: verts.map((v) => [...v]),
              inserted: false,
              vertexIndex: null,
            };
      map.dragPan.disable();
      map.getCanvas().setPointerCapture(pointerId);
      map.getCanvas().style.cursor = "grabbing";
    };

    handlersRef.current = {
      onPointerDown(e) {
        if (e.button !== 0 || !e.isPrimary) return;
        const map = mapRef.current;
        const pt = canvasPoint(e.clientX, e.clientY);
        if (!map || !pt) return;
        const lngLat = map.unproject(pt);
        pointerDownRef.current = { x: e.clientX, y: e.clientY, t: Date.now(), moved: false };
        if (previewRef.current) return;
        // Handles stay live right after a preset shape is placed, even though
        // the tool is still e.g. "circle" — let the user immediately drag an
        // edge/vertex without switching tools first.
        if (editingRef.current && toolRef.current !== "edit") {
          const editHit = findEditHandle(pt);
          if (editHit) {
            beginHandleDrag(map, editHit, lngLat, e.pointerId);
            return;
          }
        }
        if (toolRef.current === "edit") {
          const editHit = findEditHandle(pt);
          if (editHit) {
            beginHandleDrag(map, editHit, lngLat, e.pointerId);
            return;
          }
          const hit = findShapeAt(pt, lngLat);
          if (!hit) {
            setEditing(null);
            return;
          }
          const verts = getShapeVerts(hit.shape);
          if (!verts) return;
          setEditing(hit.shape);
          dragRef.current =
            hit.vertexIndex != null
              ? {
                  kind: "vertex",
                  shape: hit.shape,
                  vertexIndex: hit.vertexIndex,
                  baseLat: lngLat.lat,
                  baseLng: lngLat.lng,
                  origVerts: verts.map((v) => [...v]),
                  inserted: false,
                }
              : {
                  kind: "move",
                  shape: hit.shape,
                  baseLat: lngLat.lat,
                  baseLng: lngLat.lng,
                  origVerts: verts.map((v) => [...v]),
                };
          map.dragPan.disable();
          map.getCanvas().setPointerCapture(e.pointerId);
          map.getCanvas().style.cursor = "grabbing";
          return;
        }
        if (toolRef.current !== "freehand") {
          shapeAnchorRef.current = { lat: lngLat.lat, lng: lngLat.lng };
          shapeCursorRef.current = { lat: lngLat.lat, lng: lngLat.lng };
          setShapeAnchor(shapeAnchorRef.current);
          setShapeCursor(shapeCursorRef.current);
          map.dragPan.disable();
          map.getCanvas().setPointerCapture(e.pointerId);
        }
      },
      onPointerMove(e) {
        scheduleMove(e);
      },
      onPointerUp(e) {
        const map = mapRef.current;
        const pt = canvasPoint(e.clientX, e.clientY);
        if (!map || !pt) return;
        flushPendingMove();
        const lngLat = map.unproject(pt);
        const down = pointerDownRef.current;
        pointerDownRef.current = null;
        const moved = down ? Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6 : true;
        const canvas = map.getCanvas();
        if (dragRef.current) {
          const d = dragRef.current;
          dragRef.current = null;
          if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
          if (!moved && d.kind === "vertex" && !d.inserted) {
            const verts = getShapeVerts(d.shape);
            if (verts && verts.length > 3) removeVertexAt(d.shape, d.vertexIndex);
          }
        }
        if (shapeAnchorRef.current && toolRef.current !== "freehand") {
          const anchor = shapeAnchorRef.current;
          const cursor = shapeCursorRef.current;
          if (moved) {
            commitShapeDrag();
          } else {
            cancelShapeDrag();
          }
          if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
          if (!moved && cursor && anchor) {
            setEditing({ kind: modeRef.current, index: modeRef.current === "zone" ? 0 : exclusionsRef.current.length });
          }
        }
        if (moved) {
          canvas.style.cursor = editingRef.current ? "default" : "crosshair";
          return;
        }
        if (previewRef.current) {
          setPreviewPoint({ lat: lngLat.lat, lng: lngLat.lng });
          return;
        }
        if (toolRef.current === "edit") {
          if (editingRef.current) return;
          return;
        }
        if (toolRef.current !== "freehand") return;
        const w = workingRef.current;
        if (w.length >= 3) {
          const first = map.project([w[0][1], w[0][0]]);
          if (first && Math.hypot(first.x - pt.x, first.y - pt.y) <= CLOSE_HIT_PX) {
            finalizeWorking();
            return;
          }
        }
        const last = lastTapRef.current;
        const now = Date.now();
        if (last && now - last.t < 300 && Math.hypot(last.x - pt.x, last.y - pt.y) <= 6) {
          lastTapRef.current = null;
          if (w.length >= 3) finalizeWorking();
          return;
        }
        lastTapRef.current = { t: now, x: pt.x, y: pt.y };
        // Drawing a zone is the alternative to a saved location point — a
        // zone and a location are mutually exclusive, so the first drawn
        // point drops any location that was picked earlier.
        if (modeRef.current === "zone" && w.length === 0) setLocation(null);
        setWorking((v) => [...v, [lngLat.lat, lngLat.lng]]);
      },
      onPointerCancel(e) {
        const map = mapRef.current;
        if (map) {
          const canvas = map.getCanvas();
          if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
          canvas.style.cursor = editingRef.current ? "default" : "crosshair";
        }
        if (rafRef.current != null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        pendingMoveRef.current = null;
        pointerDownRef.current = null;
        dragRef.current = null;
        if (shapeAnchorRef.current) cancelShapeDrag();
      },
      onMouseLeave() {
        setHoverPos(null);
      },
    };
  }, [
    cancelShapeDrag,
    canvasPoint,
    commitShapeDrag,
    commitVertsToState,
    finalizeWorking,
    findEditHandle,
    findShapeAt,
    findShapeVertex,
    flushPendingMove,
    getShapeVerts,
    removeVertexAt,
    sameShape,
    scheduleMove,
    updateCursor,
  ]);

  // Lazily create the map the first time the drawer opens. The component is
  // kept alive (hidden, not unmounted) between opens, so the map + GL context
  // survive and reopens skip the expensive style parse/init. No cleanup here
  // — teardown only happens on real unmount (separate effect below).
  useEffect(() => {
    if (!open || initializedRef.current) return;
    initializedRef.current = true;

    let map;
    try {
      const camera = cameraFromGeoshape(initialZone, initialLocation);
      const opts = {
        container: mapContainerRef.current,
        style: TILE_STYLE,
        ...camera,
        localIdeographFontFamily: "sans-serif",
      };
      if (camera.bounds) opts.fitBoundsOptions = { padding: 60, maxZoom: 15, duration: 0 };
      map = new maplibregl.Map(opts);
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
      setTilesLoading(true);
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

      map.addSource("gz-location-marker", { type: "geojson", data: emptyCollection() });
      map.addLayer({ id: "gz-location-marker-dot", type: "circle", source: "gz-location-marker", paint: { "circle-radius": 8, "circle-color": "#10b981", "circle-stroke-color": "#fff", "circle-stroke-width": 2.5 } });

      // Resize/edit handles for the selected shape: corner dots + edge
      // midpoints. Data + paint are driven by the handles effect below.
      map.addSource("gz-verts", { type: "geojson", data: emptyCollection() });
      map.addLayer({ id: "gz-verts-circle", type: "circle", source: "gz-verts", paint: { "circle-radius": 6, "circle-color": "#ffffff", "circle-stroke-color": ZONE_LINE, "circle-stroke-width": 2 } });

      map.addSource("gz-mid", { type: "geojson", data: emptyCollection() });
      map.addLayer({ id: "gz-mid-circle", type: "circle", source: "gz-mid", paint: { "circle-radius": 4, "circle-color": ZONE_LINE, "circle-stroke-color": "#ffffff", "circle-stroke-width": 1.5 } });

      map.getCanvas().style.cursor = "crosshair";
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

    map.on("idle", () => setTilesLoading(false));

    const canvas = map.getCanvas();
    const listeners = {
      mouseleave: () => handlersRef.current.onMouseLeave(),
      pointerdown: (e) => handlersRef.current.onPointerDown(e),
      pointermove: (e) => handlersRef.current.onPointerMove(e),
      pointerup: (e) => handlersRef.current.onPointerUp(e),
      pointercancel: (e) => handlersRef.current.onPointerCancel(e),
    };
    canvas.addEventListener("mouseleave", listeners.mouseleave);
    canvas.addEventListener("pointerdown", listeners.pointerdown);
    canvas.addEventListener("pointermove", listeners.pointermove);
    canvas.addEventListener("pointerup", listeners.pointerup);
    canvas.addEventListener("pointercancel", listeners.pointercancel);
    canvasListenersRef.current = { canvas, listeners };

    // Keep screen-space handle hit-testing valid after pans/zooms.
    map.on("moveend", refreshProjectedHandles);
    map.on("zoomend", refreshProjectedHandles);

    mapRef.current = map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Unmount-only teardown: the map lives for the whole keep-alive lifetime and
  // is only destroyed when the parent actually unmounts this component. Also
  // warms the tile style/connection once on mount.
  useEffect(() => {
    warmMapResources();
    return () => {
      if (failTimerRef.current != null) {
        window.clearTimeout(failTimerRef.current);
        failTimerRef.current = null;
      }
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      pendingMoveRef.current = null;
      const reg = canvasListenersRef.current;
      if (reg) {
        reg.canvas.removeEventListener("mouseleave", reg.listeners.mouseleave);
        reg.canvas.removeEventListener("pointerdown", reg.listeners.pointerdown);
        reg.canvas.removeEventListener("pointermove", reg.listeners.pointermove);
        reg.canvas.removeEventListener("pointerup", reg.listeners.pointerup);
        reg.canvas.removeEventListener("pointercancel", reg.listeners.pointercancel);
      }
      const map = mapRef.current;
      if (map) {
        map.off("moveend", refreshProjectedHandles);
        map.off("zoomend", refreshProjectedHandles);
        map.remove();
        mapRef.current = null;
      }
      mapReadyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-initialize editor state from the current props each time the drawer
  // opens, since the component stays mounted (keep-alive) across opens. Done
  // during render — React's recommended way to adjust state when a prop
  // changes — so reopens always start from the saved data.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open && !prevOpen) {
    setPrevOpen(true);
    setZone(Array.isArray(initialZone) && initialZone.length >= 3 ? initialZone.map((v) => [...v]) : []);
    setExclusions(Array.isArray(initialExclusions) ? initialExclusions.map((e) => [...e]) : []);
    setLocation(initialLocation && initialLocation.lat != null ? { ...initialLocation } : null);
    setWorking([]);
    setHoverPos(null);
    setPreview(false);
    setPreviewPoint(null);
    setEditing(null);
    setMode("zone");
    setTool("freehand");
    setShapeAnchor(null);
    setShapeCursor(null);
  }
  // Mirror the close so the next open re-runs the re-init above. The drawer
  // stays mounted (keep-alive), so without this every later open would keep
  // the previous area's stale zone instead of the one being edited.
  if (!open && prevOpen) {
    setPrevOpen(false);
  }

  // Reframe the kept-alive map onto the current zone/location each time it
  // reopens (purely an external-system camera update, no React state).
  useEffect(() => {
    shapeAnchorRef.current = null;
    shapeCursorRef.current = null;
    const map = mapRef.current;
    if (!open || !map || !mapReadyRef.current) return;
    map.resize();
    const camera = cameraFromGeoshape(initialZone, initialLocation);
    if (camera.bounds) {
      map.fitBounds(camera.bounds, { padding: 60, maxZoom: 15, duration: 0 });
    } else {
      map.jumpTo({ center: camera.center, zoom: camera.zoom });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Pause the render loop while hidden so the keep-alive map costs ~nothing
  // and never fights the browser's visibility budget.
  useEffect(() => {
    if (open) return;
    const map = mapRef.current;
    if (map) map.stop();
    dragRef.current = null;
    pointerDownRef.current = null;
    lastTapRef.current = null;
    pendingMoveRef.current = null;
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, [open]);

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

  // Render corner + edge-midpoint handles for the selected shape, styled to
  // match the zone (emerald) or exclusion (rose). Also refreshes the cached
  // screen-space hit-test positions.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const ensure = (id, data) => {
      if (map.getSource(id)) map.getSource(id).setData(data);
    };
    let vertsFC = emptyCollection();
    let midFC = emptyCollection();
    const color = editing?.kind === "exclusion" ? EXCL_LINE : ZONE_LINE;
    if (editing) {
      const verts = getShapeVerts(editing);
      if (verts && verts.length >= 3) {
        vertsFC = {
          type: "FeatureCollection",
          features: [
            { type: "Feature", properties: {}, geometry: { type: "MultiPoint", coordinates: verts.map(([lat, lng]) => [lng, lat]) } },
          ],
        };
        midFC = {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {},
              geometry: {
                type: "MultiPoint",
                coordinates: verts.map((_, i) => {
                  const m = edgeMidpoint(verts, i);
                  return [m[1], m[0]];
                }),
              },
            },
          ],
        };
      }
    }
    ensure("gz-verts", vertsFC);
    ensure("gz-mid", midFC);
    if (map.getLayer("gz-verts-circle")) map.setPaintProperty("gz-verts-circle", "circle-stroke-color", color);
    if (map.getLayer("gz-mid-circle")) map.setPaintProperty("gz-mid-circle", "circle-color", color);
    refreshProjectedHandles();
  }, [editing, zone, exclusions, mapReady, getShapeVerts, refreshProjectedHandles]);

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

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    if (map.getSource("gz-location-marker")) {
      map
        .getSource("gz-location-marker")
        .setData(location ? { type: "FeatureCollection", features: [pointFeature(location.lng, location.lat)] } : emptyCollection());
    }
  }, [location, mapReady]);

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
      if (!openRef.current) return;
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
        return;
      }
      if (e.key.startsWith("Arrow") && !previewRef.current) {
        const shape = editingRef.current;
        if (!shape) return;
        const verts = getShapeVerts(shape);
        if (!verts || verts.length < 3) return;
        const step = e.shiftKey ? 0.00005 : 0.00001;
        const dLat = e.key === "ArrowUp" ? step : e.key === "ArrowDown" ? -step : 0;
        const dLng = e.key === "ArrowRight" ? step : e.key === "ArrowLeft" ? -step : 0;
        if (!dLat && !dLng) return;
        e.preventDefault();
        commitVertsToState(shape, translateShape(verts, dLat, dLng).map(clampLatLng));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cancelShapeDrag, commitVertsToState, finalizeWorking, getShapeVerts, onCancel]);

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
    if (previewRef.current) {
      setPreviewPoint(point);
      return;
    }
    setLocation({
      name: result.formatted || "",
      address: result.formatted || "",
      lat: point.lat,
      lng: point.lng,
    });
    // Choosing a location point is the alternative to drawing a zone — drop
    // any previously drawn polygon so the area is saved location-only.
    setZone([]);
    setExclusions([]);
    setWorking([]);
  };
  const canPreview = zone.length >= 3;
  const verdict = previewPoint ? resolvePickupVerdict(zone, exclusions, [previewPoint.lat, previewPoint.lng]) : null;
  const hintText = preview
    ? "Customer view — search an address or click the map to check pickup availability."
    : tool === "edit"
      ? "Drag a corner to reshape, drag an edge midpoint to add a corner and pull it out, drag inside to move, click a corner to delete it, click outside to stop editing."
      : tool === "freehand"
        ? mode === "zone"
          ? "Click to trace your pickup zone. Click the first point again (or double-click / press Enter) to close the shape."
          : "Draw the area inside your zone where pickups are NOT available. Click the first point again to close."
        : "Click to anchor the shape, then drag to size it and release to place it.";

  return (
    <div className={`fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4${open ? "" : " hidden"}`}>
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
                  aria-pressed={mode === "zone"}
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
                  aria-pressed={mode === "exclusion"}
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
                  aria-label="Freehand draw"
                  aria-pressed={tool === "freehand"}
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
                    aria-label={`Place ${label.toLowerCase()} shape`}
                    aria-pressed={tool === id}
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
                  aria-label="Edit shapes"
                  aria-pressed={tool === "edit"}
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

              </>
          )}

          {/* Location search — edit mode sets the area point; preview mode tests an address */}
          <div className={preview ? "mt-4" : "mt-3"}>
            <LocationAutocomplete
              hideLabel
              placeholder={
                preview
                  ? "Search an address to test pickup (e.g., Osu, Accra)"
                  : "Search a location to focus the map (e.g., Osu, Accra)"
              }
              minChars={2}
              clearOnSelect
              onSelect={handleLocationSelect}
            />
          </div>

          {/* Map */}
          <div className="rounded-xl overflow-hidden border border-slate-100 shadow-sm relative mt-4">
            <div ref={mapContainerRef} className="w-full h-[380px]" />
            {mapReady && tilesLoading && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white shadow-sm pointer-events-none">
                <Loader2 size={12} className="animate-spin" />
                Loading tiles...
              </div>
            )}
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
                className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm text-white"
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
              Tip: click a saved shape to select it, then drag its corners to reshape, drag an edge midpoint to add and pull out a new corner, drag inside to move it, or click a corner to delete it.
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
                        ? `Drawn (${zone.length} points) — covers ≈ ${formatAreaKm2(polygonAreaKm2(zone))} with ≈ ${formatPerimeterKm(polygonPerimeterKm(zone))} of boundary`
                        : location
                          ? "Not drawn — customers within the named area can select pickup"
                          : "Nothing set yet — draw a zone on the map or search a location above"}
                    </p>
                    {location && zone.length < 3 && (
                      <button
                        type="button"
                        onClick={() => setLocation(null)}
                        className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 hover:text-emerald-800 transition-colors"
                      >
                        <X className="w-3 h-3" />
                        {location.name || location.address || "Location point"} — remove point
                      </button>
                    )}
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
                  location: location
                    ? {
                        name: location.name || "",
                        address: location.address || "",
                        lat: Number(location.lat.toFixed(6)),
                        lng: Number(location.lng.toFixed(6)),
                      }
                    : null,
                })
              }
              disabled={zone.length < 3 && !location}
              className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                zone.length >= 3 || location ? "text-white bg-emerald-600 hover:bg-emerald-700" : "text-slate-400 bg-slate-100 cursor-not-allowed"
              }`}
            >
              {zone.length >= 3 ? "Save zone" : "Save area"}
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
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  const zones = areas.filter((a) => Array.isArray(a.polygon) && a.polygon.length >= 3);
  const exclusions = zones.flatMap((a) => (Array.isArray(a.exclusions) ? a.exclusions : []));

  useEffect(() => {
    if (!containerRef.current || initializedRef.current || zones.length === 0) return;
    initializedRef.current = true;

    let map;
    try {
      let minLat = Infinity;
      let maxLat = -Infinity;
      let minLng = Infinity;
      let maxLng = -Infinity;
      const extend = (poly) => poly.forEach(([lat, lng]) => {
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
      });
      zones.forEach((a) => extend(a.polygon));
      exclusions.forEach(extend);
      const opts = {
        container: containerRef.current,
        style: TILE_STYLE,
        localIdeographFontFamily: "sans-serif",
      };
      if (minLat !== Infinity) {
        opts.bounds = [[minLng, minLat], [maxLng, maxLat]];
        opts.fitBoundsOptions = { padding: 40, maxZoom: 14.5, duration: 0 };
      } else {
        opts.center = [DEFAULT_CENTER.lng, DEFAULT_CENTER.lat];
        opts.zoom = 11;
      }
      map = new maplibregl.Map(opts);
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
      setReady(true);
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
      if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 40, maxZoom: 14.5, duration: 0 });
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

  // Keep the map sized when the preview container resizes.
  useEffect(() => {
    const el = containerRef.current;
    const map = mapRef.current;
    if (!el || !map || !ready) return undefined;
    const observer = new ResizeObserver(() => map.resize());
    observer.observe(el);
    return () => observer.disconnect();
  }, [ready]);

  if (zones.length === 0) return null;

  return (
    <div className={`rounded-xl overflow-hidden border border-slate-200 relative ${className}`}>
      <div ref={containerRef} style={{ height }} className="w-full" />
      {!ready && !failed && (
        <div className="absolute inset-0 bg-slate-50 flex items-center justify-center gap-2 text-sm text-slate-500">
          <Loader2 size={16} className="animate-spin text-emerald-600" />
          Loading map...
        </div>
      )}
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
