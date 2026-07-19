"use client";

import React from "react";
import {
  X,
  Thermometer,
  Cloud,
  Wind,
  Droplets,
  Sun,
  AlertTriangle,
  Shield,
  Lightbulb,
  Users,
  Phone,
  Hospital,
  Star,
} from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SafetyData {
  aqi: number;
  uvIndex: number;
  humidity: number;
  temperature: number;
  rainChance: number;
  windSpeed: number;
  weatherCondition: string;
  trafficLevel: string;
  roadSafetyRating: number;
  streetLightingRating: number;
  crowdDensity: string;
  emergencyContacts: { name: string; phone: string }[];
  nearbyHospitals: { name: string; distance: number; phone: string }[];
  note?: string;
}

interface SafetyPanelProps {
  center: [number, number] | null;
  onClose: () => void;
}

function getAqiColor(aqi: number): string {
  if (aqi <= 50) return "text-emerald-400 bg-emerald-500/10";
  if (aqi <= 100) return "text-yellow-400 bg-yellow-500/10";
  if (aqi <= 200) return "text-orange-400 bg-orange-500/10";
  return "text-red-400 bg-red-500/10";
}

function getUvColor(uv: number): string {
  if (uv <= 2) return "text-emerald-400 bg-emerald-500/10";
  if (uv <= 7) return "text-yellow-400 bg-yellow-500/10";
  return "text-red-400 bg-red-500/10";
}

function getTempColor(temp: number): string {
  if (temp < 15) return "text-blue-400 bg-blue-500/10";
  if (temp <= 30) return "text-emerald-400 bg-emerald-500/10";
  if (temp <= 40) return "text-orange-400 bg-orange-500/10";
  return "text-red-400 bg-red-500/10";
}

function getTrafficColor(level: string): string {
  switch (level) {
    case "low": return "text-emerald-400 bg-emerald-500/10";
    case "moderate": return "text-yellow-400 bg-yellow-500/10";
    case "high": return "text-orange-400 bg-orange-500/10";
    case "very_high": return "text-red-400 bg-red-500/10";
    default: return "text-white/50 bg-white/5";
  }
}

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i < rating ? "text-yellow-400 fill-yellow-400" : "text-white/20"
          )}
        />
      ))}
    </div>
  );
}

function Indicator({
  label,
  value,
  colorClass,
  icon: Icon,
}: {
  label: string;
  value: string;
  colorClass: string;
  icon: React.ElementType;
}) {
  return (
    <div className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5", colorClass)}>
      <Icon className="h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium opacity-80">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}

export function SafetyPanel({ center, onClose }: SafetyPanelProps) {
  const queryString = center
    ? `lat=${center[1]}&lng=${center[0]}`
    : "lat=20.5937&lng=78.9629";

  const { data, loading, error } = useFetch<SafetyData>(
    `/api/safety?${queryString}`
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-white">Safety & Conditions</h3>
        </div>
        <button
          onClick={onClose}
          className="cursor-pointer rounded-lg p-1 text-white/50 hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-12 rounded-xl" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center py-12 text-center">
            <AlertTriangle className="mb-3 h-8 w-8 text-red-400" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        ) : !data ? (
          <div className="flex flex-col items-center py-12 text-center">
            <Shield className="mb-3 h-8 w-8 text-white/30" />
            <p className="text-sm text-white/50">No data available</p>
          </div>
        ) : (
          <>
            {data.note && (
              <div className="rounded-xl bg-yellow-500/10 px-3 py-2 text-xs text-yellow-400">
                {data.note}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Indicator
                label="AQI"
                value={`${data.aqi} ${data.aqi <= 50 ? "(Good)" : data.aqi <= 100 ? "(Moderate)" : data.aqi <= 200 ? "(Unhealthy)" : "(Hazardous)"}`}
                colorClass={getAqiColor(data.aqi)}
                icon={Wind}
              />
              <Indicator
                label="UV Index"
                value={`${data.uvIndex} ${data.uvIndex <= 2 ? "(Low)" : data.uvIndex <= 7 ? "(Moderate)" : "(Extreme)"}`}
                colorClass={getUvColor(data.uvIndex)}
                icon={Sun}
              />
              <Indicator
                label="Temperature"
                value={`${data.temperature}°C`}
                colorClass={getTempColor(data.temperature)}
                icon={Thermometer}
              />
              <Indicator
                label="Rain Chance"
                value={`${data.rainChance}%`}
                colorClass={
                  data.rainChance <= 20
                    ? "text-blue-400 bg-blue-500/10"
                    : data.rainChance <= 50
                    ? "text-yellow-400 bg-yellow-500/10"
                    : "text-red-400 bg-red-500/10"
                }
                icon={Droplets}
              />
              <Indicator
                label="Humidity"
                value={`${data.humidity}%`}
                colorClass="text-cyan-400 bg-cyan-500/10"
                icon={Cloud}
              />
              <Indicator
                label="Wind"
                value={`${data.windSpeed} km/h`}
                colorClass="text-indigo-400 bg-indigo-500/10"
                icon={Wind}
              />
            </div>

            <Indicator
              label="Traffic"
              value={data.trafficLevel?.replace("_", " ") || "Unknown"}
              colorClass={getTrafficColor(data.trafficLevel)}
              icon={AlertTriangle}
            />

            <div className="space-y-2">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Road Safety</p>
              <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
                <Shield className="h-4 w-4 text-white/40" />
                <StarRating rating={data.roadSafetyRating} />
                <span className="text-xs text-white/40">{data.roadSafetyRating}/5</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Street Lighting</p>
              <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
                <Lightbulb className="h-4 w-4 text-white/40" />
                <StarRating rating={data.streetLightingRating} />
                <span className="text-xs text-white/40">{data.streetLightingRating}/5</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Crowd Density</p>
              <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5 capitalize">
                <Users className="h-4 w-4 text-white/40" />
                <span className="text-sm text-white">{data.crowdDensity}</span>
              </div>
            </div>

            {data.emergencyContacts && data.emergencyContacts.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> Emergency Contacts
                </p>
                {data.emergencyContacts.map((contact, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2.5"
                  >
                    <span className="text-sm text-white">{contact.name}</span>
                    <a
                      href={`tel:${contact.phone}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {contact.phone}
                    </a>
                  </div>
                ))}
              </div>
            )}

            {data.nearbyHospitals && data.nearbyHospitals.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
                  <Hospital className="h-3.5 w-3.5" /> Nearby Hospitals
                </p>
                {data.nearbyHospitals.map((hospital, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm text-white">{hospital.name}</p>
                      <p className="text-xs text-white/40">{hospital.distance} km</p>
                    </div>
                    {hospital.phone && (
                      <a
                        href={`tel:${hospital.phone}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {hospital.phone}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
