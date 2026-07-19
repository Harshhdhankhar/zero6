"use client";

import { useState } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { useAuth } from "@/hooks/use-auth";
import {
  Route, MapPin, Plus, Loader2, AlertCircle, RefreshCw,
  Mountain, Clock, Users,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn, formatDistance } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { actions } from "@/lib/actions";

interface CommunityRoute {
  id: string; title: string; description: string;
  distance: number; elevationGain: number; difficulty: string;
  location: string; city: string; coordinates: any;
  imageUrl: string; timesCompleted: number; bestTime: number;
  isFeatured: boolean;
  createdBy: { id: string; name: string; avatar: string } | null;
  createdAt: string;
}

export function CommunityRoutes({ clubId, isAdmin }: { clubId: string; isAdmin?: boolean }) {
  const { isAuthenticated } = useAuth();
  const { data, loading, error, refetch } = useFetch<{ data: CommunityRoute[] }>(
    `/api/clubs/${clubId}/routes`
  );
  const routes = data?.data || [];
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", distance: "", elevationGain: "", difficulty: "easy", location: "" });

  const handleCreate = async () => {
    if (!form.title.trim() || !form.distance) {
      toast.error("Title and distance are required");
      return;
    }
    setCreating(true);
    try {
      await actions.createCommunityRoute(clubId, {
        title: form.title.trim(),
        description: form.description,
        distance: parseFloat(form.distance),
        elevationGain: parseFloat(form.elevationGain) || 0,
        difficulty: form.difficulty,
        location: form.location,
      });
      setForm({ title: "", description: "", distance: "", elevationGain: "", difficulty: "easy", location: "" });
      setShowCreate(false);
      refetch();
      toast.success("Route created");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>;

  if (error) return (
    <div className="flex flex-col items-center py-12 text-center">
      <AlertCircle className="h-8 w-8 text-red-400 mb-2" />
      <p className="text-sm text-white/60">Failed to load routes</p>
      <Button variant="secondary" size="sm" onClick={refetch} className="mt-3 gap-2"><RefreshCw className="h-3 w-3" /> Retry</Button>
    </div>
  );

  return (
    <div>
      {isAdmin && (
        <div className="flex justify-end mb-4">
          <Button size="sm" onClick={() => setShowCreate(!showCreate)}
            className="bg-primary hover:bg-primary/90 gap-1.5">
            <Plus className="h-3 w-3" /> Add Route
          </Button>
        </div>
      )}

      {/* Create Form */}
      {showCreate && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
          className="mb-4 p-4 rounded-2xl border border-border bg-white/[0.03] space-y-3">
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
            placeholder="Route name" className="w-full bg-secondary/30 rounded-xl text-xs text-white placeholder:text-white/30 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/30 border border-border" />
          <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Description (optional)" className="w-full bg-secondary/30 rounded-xl text-xs text-white placeholder:text-white/30 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/30 border border-border" />
          <div className="grid grid-cols-3 gap-2">
            <input value={form.distance} onChange={e => setForm({ ...form, distance: e.target.value })}
              placeholder="Distance (km)" type="number" step="0.1"
              className="bg-secondary/30 rounded-xl text-xs text-white placeholder:text-white/30 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/30 border border-border" />
            <input value={form.elevationGain} onChange={e => setForm({ ...form, elevationGain: e.target.value })}
              placeholder="Elevation (m)" type="number"
              className="bg-secondary/30 rounded-xl text-xs text-white placeholder:text-white/30 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/30 border border-border" />
            <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}
              className="bg-secondary/30 rounded-xl text-xs text-white px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/30 border border-border">
              <option value="easy">Easy</option>
              <option value="moderate">Moderate</option>
              <option value="hard">Hard</option>
              <option value="extreme">Extreme</option>
            </select>
          </div>
          <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
            placeholder="Location" className="w-full bg-secondary/30 rounded-xl text-xs text-white placeholder:text-white/30 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/30 border border-border" />
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button size="sm" onClick={handleCreate} disabled={creating}
              className="bg-primary hover:bg-primary/90">
              {creating ? <Loader2 className="h-3 w-3 animate-spin" /> : "Create"}
            </Button>
          </div>
        </motion.div>
      )}

      {routes.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <Route className="h-10 w-10 text-white/20 mb-2" />
          <p className="text-sm text-white/40">No routes available yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {routes.map((route, i) => (
            <motion.div key={route.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-border bg-white/[0.03] p-4 hover:border-border transition-all">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center">
                  <Route className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-white truncate">{route.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {route.location && <span className="text-[10px] text-white/40 flex items-center gap-1"><MapPin className="h-3 w-3" />{route.location}</span>}
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0 rounded capitalize">{route.difficulty}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="text-center p-1.5 rounded-lg bg-secondary/30">
                      <p className="text-[11px] font-bold text-white">{formatDistance(route.distance || 0)}</p>
                      <p className="text-[8px] text-white/30 uppercase">Dist</p>
                    </div>
                    <div className="text-center p-1.5 rounded-lg bg-secondary/30">
                      <p className="text-[11px] font-bold text-white">{(route.elevationGain || 0).toFixed(0)}m</p>
                      <p className="text-[8px] text-white/30 uppercase">Elev</p>
                    </div>
                    <div className="text-center p-1.5 rounded-lg bg-secondary/30">
                      <p className="text-[11px] font-bold text-white">{route.timesCompleted || 0}</p>
                      <p className="text-[8px] text-white/30 uppercase">Runs</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
