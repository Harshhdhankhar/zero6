"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Trash2, Undo2, Save, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDistance } from "@/lib/utils";
import type { RoutePoint } from "@/types";

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function haversine(a: RoutePoint, b: RoutePoint): number {
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const aVal =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLon * sinDLon;
  return R * 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
}

function calculateDistance(waypoints: RoutePoint[]): number {
  if (waypoints.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < waypoints.length; i++) {
    total += haversine(waypoints[i - 1], waypoints[i]);
  }
  return total;
}

function calculateElevation(waypoints: RoutePoint[]): number {
  let gain = 0;
  for (let i = 1; i < waypoints.length; i++) {
    const diff = (waypoints[i].elevation || 0) - (waypoints[i - 1].elevation || 0);
    if (diff > 0) gain += diff;
  }
  return gain;
}

export interface RouteBuilderProps {
  onSave?: (data: {
    title: string;
    description?: string;
    distance: number;
    elevationGain: number;
    difficulty: string;
    surfaceType: string;
    routeType: string;
    geometry: RoutePoint[];
    city?: string;
    tags: string[];
  }) => void;
  onClose?: () => void;
}

const INITIAL_VIEW = { lat: 20.5937, lng: 78.9629 }; // Center of India

export function RouteBuilder({ onSave, onClose }: RouteBuilderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [waypoints, setWaypoints] = useState<RoutePoint[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("moderate");
  const [surfaceType, setSurfaceType] = useState("road");
  const [routeType, setRouteType] = useState("loop");
  const [city, setCity] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });

  const distance = calculateDistance(waypoints);
  const elevationGain = calculateElevation(waypoints);
  const tags = tagsInput
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = "hsl(240, 10%, 6%)";
    ctx.fillRect(0, 0, w, h);

    const gridSize = 40 * zoom;
    ctx.strokeStyle = "hsl(240, 10%, 12%)";
    ctx.lineWidth = 1;
    const offsetX = pan.x % gridSize;
    const offsetY = pan.y % gridSize;
    for (let x = offsetX; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = offsetY; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    if (waypoints.length === 0) {
      ctx.fillStyle = "hsl(240, 5%, 45%)";
      ctx.font = "14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Click on the map to add waypoints", w / 2, h / 2);
      return;
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    const projected = waypoints.map((wp) => {
      const x = (wp.lng - INITIAL_VIEW.lng) * 50000 * zoom + w / 2 + pan.x;
      const y = -(wp.lat - INITIAL_VIEW.lat) * 50000 * zoom + h / 2 + pan.y;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      return { x, y, ...wp };
    });

    ctx.strokeStyle = "#FF5A1F";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = "rgba(255, 90, 31, 0.3)";
    ctx.shadowBlur = 8;

    ctx.beginPath();
    projected.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    if (routeType === "loop" && projected.length > 2) {
      ctx.closePath();
    }
    ctx.stroke();

    ctx.shadowBlur = 0;
    projected.forEach((p, i) => {
      ctx.fillStyle = i === 0 ? "#22c55e" : i === projected.length - 1 ? "#ef4444" : "#FF5A1F";
      ctx.beginPath();
      ctx.arc(p.x, p.y, i === 0 || i === projected.length - 1 ? 7 : 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${i + 1}`, p.x, p.y);
    });

    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`📍 Start (${waypoints[0].lat.toFixed(4)}, ${waypoints[0].lng.toFixed(4)})`, 10, 20);
    ctx.fillText(`🏁 End (${waypoints[waypoints.length - 1].lat.toFixed(4)}, ${waypoints[waypoints.length - 1].lng.toFixed(4)})`, 10, 36);
  }, [waypoints, pan, zoom, routeType]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const lng = (x - pan.x - canvas.width / (2 * window.devicePixelRatio)) / (50000 * zoom) + INITIAL_VIEW.lng;
    const lat = -(y - pan.y - canvas.height / (2 * window.devicePixelRatio)) / (50000 * zoom) + INITIAL_VIEW.lat;

    setWaypoints((prev) => [...prev, { lat, lng }]);
  };

  const handleCanvasRightClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const tolerance = 10;
    const lng = (x - pan.x - canvas.width / (2 * window.devicePixelRatio)) / (50000 * zoom) + INITIAL_VIEW.lng;
    const lat = -(y - pan.y - canvas.height / (2 * window.devicePixelRatio)) / (50000 * zoom) + INITIAL_VIEW.lat;

    let closestIdx = -1;
    let closestDist = Infinity;
    for (let i = 0; i < waypoints.length; i++) {
      const dx = (waypoints[i].lng - lng) * 50000 * zoom;
      const dy = -(waypoints[i].lat - lat) * 50000 * zoom;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = i;
      }
    }

    if (closestIdx >= 0 && closestDist < tolerance) {
      setWaypoints((prev) => prev.filter((_, i) => i !== closestIdx));
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDragging.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY };
    panStart.current = { x: pan.x, y: pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      isDragging.current = true;
      setPan({ x: panStart.current.x + dx, y: panStart.current.y + dy });
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((prev) => Math.max(0.1, Math.min(10, prev * delta)));
  };

  const clearWaypoints = () => setWaypoints([]);
  const removeLastWaypoint = () => setWaypoints((prev) => prev.slice(0, -1));

  const handleSave = () => {
    if (!onSave || waypoints.length < 2) return;
    onSave({
      title,
      description: description || undefined,
      distance,
      elevationGain,
      difficulty,
      surfaceType,
      routeType,
      geometry: waypoints,
      city: city || undefined,
      tags,
    });
  };

  const canSave = waypoints.length >= 2 && title.trim().length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Build a Route</h2>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <Label>Title</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="My awesome route"
          />
        </div>
        <div>
          <Label>Description (optional)</Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your route..."
          />
        </div>
      </div>

      <div
        className="relative rounded-xl overflow-hidden border border-border"
        style={{ height: 300 }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          onClick={handleCanvasClick}
          onContextMenu={handleCanvasRightClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={() => {}}
          onWheel={handleWheel}
        />
        <div className="absolute bottom-2 left-2 flex gap-1">
          <button
            onClick={removeLastWaypoint}
            disabled={waypoints.length === 0}
            className="p-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 disabled:opacity-30"
            title="Undo last point"
          >
            <Undo2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={clearWaypoints}
            disabled={waypoints.length === 0}
            className="p-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 disabled:opacity-30"
            title="Clear all"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="absolute top-2 right-2 flex gap-1">
          <Badge variant="secondary" className="text-[10px]">
            {waypoints.length} pts
          </Badge>
          <Badge variant="secondary" className="text-[10px]">
            {formatDistance(distance)}
          </Badge>
          <Badge variant="secondary" className="text-[10px]">
            ⛰️ {elevationGain.toFixed(0)}m
          </Badge>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        <p>🖱️ Click to add waypoint | Right-click a waypoint to remove | Scroll to zoom | Drag to pan</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Difficulty</Label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="easy">Easy</option>
            <option value="moderate">Moderate</option>
            <option value="hard">Hard</option>
            <option value="extreme">Extreme</option>
          </select>
        </div>
        <div>
          <Label>Surface Type</Label>
          <select
            value={surfaceType}
            onChange={(e) => setSurfaceType(e.target.value)}
            className="w-full h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="road">Road</option>
            <option value="trail">Trail</option>
            <option value="track">Track</option>
            <option value="park">Park</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>
        <div>
          <Label>Route Type</Label>
          <select
            value={routeType}
            onChange={(e) => setRouteType(e.target.value)}
            className="w-full h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="loop">Loop</option>
            <option value="out-and-back">Out & Back</option>
            <option value="point-to-point">Point to Point</option>
          </select>
        </div>
        <div>
          <Label>City (optional)</Label>
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Mumbai"
          />
        </div>
      </div>

      <div>
        <Label>Tags (comma separated)</Label>
        <Input
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="scenic, morning, flat"
        />
      </div>

      {elevationGain > 0 && waypoints.length >= 2 && (
        <div className="space-y-1">
          <Label>Elevation Profile</Label>
          <div className="h-16 rounded-lg bg-secondary/50 p-2 flex items-end gap-[2px]">
            {waypoints.map((wp, i) => {
              const maxElev = Math.max(...waypoints.map((w) => w.elevation || 0), 1);
              const elev = wp.elevation || 0;
              const h = (elev / maxElev) * 100;
              return (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm transition-all"
                  style={{
                    height: `${Math.max(h, 2)}%`,
                    background: i === 0 ? "#22c55e" : i === waypoints.length - 1 ? "#ef4444" : "#FF5A1F",
                    opacity: i === 0 || i === waypoints.length - 1 ? 1 : 0.7,
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      <Button
        onClick={handleSave}
        disabled={!canSave}
        className="w-full"
      >
        <Save className="h-4 w-4 mr-2" />
        Save Route
        {waypoints.length >= 2 && ` (${formatDistance(distance)})`}
      </Button>
    </div>
  );
}
