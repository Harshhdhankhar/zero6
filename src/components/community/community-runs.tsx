"use client";

import { useState } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { useAuth } from "@/hooks/use-auth";
import {
  Users, Calendar, MapPin, Clock, Loader2, AlertCircle, RefreshCw,
  Plus, CheckCircle, XCircle, Route,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { actions } from "@/lib/actions";

interface CommunityRun {
  id: string; title: string; description: string;
  scheduledAt: string; meetingPoint: string;
  distance: number; paceGroup: string;
  maxParticipants: number; registeredCount: number;
  status: string; weatherNotes: string;
  isRegistered: boolean;
  route: { id: string; title: string; distance: number; difficulty: string } | null;
  createdBy: { id: string; name: string; avatar: string } | null;
  createdAt: string;
}

export function CommunityRuns({ clubId, isAdmin }: { clubId: string; isAdmin?: boolean }) {
  const { isAuthenticated } = useAuth();
  const [statusFilter, setStatusFilter] = useState("upcoming");

  const { data, loading, error, refetch } = useFetch<{ data: CommunityRun[] }>(
    `/api/clubs/${clubId}/runs?status=${statusFilter}`
  );
  const runs = data?.data || [];

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", scheduledAt: "", meetingPoint: "",
    distance: "", paceGroup: "", maxParticipants: "50",
  });

  const handleCreate = async () => {
    if (!form.title.trim() || !form.scheduledAt) {
      toast.error("Title and schedule are required");
      return;
    }
    setCreating(true);
    try {
      await actions.createCommunityRun(clubId, {
        title: form.title.trim(),
        description: form.description,
        scheduledAt: form.scheduledAt,
        meetingPoint: form.meetingPoint,
        distance: form.distance ? parseFloat(form.distance) : null,
        paceGroup: form.paceGroup,
        maxParticipants: parseInt(form.maxParticipants) || 50,
      });
      setForm({ title: "", description: "", scheduledAt: "", meetingPoint: "", distance: "", paceGroup: "", maxParticipants: "50" });
      setShowCreate(false);
      refetch();
      toast.success("Run created");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleRegister = async (runId: string) => {
    try {
      await actions.registerCommunityRun(clubId, runId);
      refetch();
      toast.success("Registered for run");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleUnregister = async (runId: string) => {
    try {
      await actions.unregisterCommunityRun(clubId, runId);
      refetch();
      toast.success("Unregistered from run");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>;

  if (error) return (
    <div className="flex flex-col items-center py-12 text-center">
      <AlertCircle className="h-8 w-8 text-red-400 mb-2" />
      <p className="text-sm text-white/60">Failed to load runs</p>
      <Button variant="secondary" size="sm" onClick={refetch} className="mt-3 gap-2"><RefreshCw className="h-3 w-3" /> Retry</Button>
    </div>
  );

  return (
    <div>
      {/* Status Filter + Create */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1.5">
          {["upcoming", "completed", "cancelled"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-[11px] font-medium transition-all cursor-pointer capitalize",
                statusFilter === s ? "bg-primary text-white" : "bg-secondary/30 text-white/40 hover:text-white/60"
              )}>
              {s}
            </button>
          ))}
        </div>
        {isAdmin && (
          <Button size="sm" onClick={() => setShowCreate(!showCreate)}
            className="bg-primary hover:bg-primary/90 gap-1.5">
            <Plus className="h-3 w-3" /> Create Run
          </Button>
        )}
      </div>

      {/* Create Form */}
      {showCreate && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
          className="mb-4 p-4 rounded-2xl border border-border bg-white/[0.03] space-y-3">
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
            placeholder="Run name" className="w-full bg-secondary/30 rounded-xl text-xs text-white placeholder:text-white/30 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/30 border border-border" />
          <input value={form.scheduledAt} onChange={e => setForm({ ...form, scheduledAt: e.target.value })}
            type="datetime-local" className="w-full bg-secondary/30 rounded-xl text-xs text-white px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/30 border border-border" />
          <div className="grid grid-cols-2 gap-2">
            <input value={form.meetingPoint} onChange={e => setForm({ ...form, meetingPoint: e.target.value })}
              placeholder="Meeting point" className="bg-secondary/30 rounded-xl text-xs text-white placeholder:text-white/30 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/30 border border-border" />
            <input value={form.distance} onChange={e => setForm({ ...form, distance: e.target.value })}
              placeholder="Distance (km)" type="number" step="0.1"
              className="bg-secondary/30 rounded-xl text-xs text-white placeholder:text-white/30 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/30 border border-border" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input value={form.paceGroup} onChange={e => setForm({ ...form, paceGroup: e.target.value })}
              placeholder="Pace group (e.g., 5:30/km)" className="bg-secondary/30 rounded-xl text-xs text-white placeholder:text-white/30 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/30 border border-border" />
            <input value={form.maxParticipants} onChange={e => setForm({ ...form, maxParticipants: e.target.value })}
              placeholder="Max participants" type="number"
              className="bg-secondary/30 rounded-xl text-xs text-white placeholder:text-white/30 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/30 border border-border" />
          </div>
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Description (optional)" rows={2}
            className="w-full bg-secondary/30 rounded-xl text-xs text-white placeholder:text-white/30 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/30 border border-border resize-none" />
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button size="sm" onClick={handleCreate} disabled={creating}
              className="bg-primary hover:bg-primary/90">
              {creating ? <Loader2 className="h-3 w-3 animate-spin" /> : "Create"}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Runs List */}
      {runs.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <Users className="h-10 w-10 text-white/20 mb-2" />
          <p className="text-sm text-white/40">No {statusFilter} runs yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {runs.map((run, i) => (
            <motion.div key={run.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-border bg-white/[0.03] p-4 hover:border-border transition-all">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white truncate">{run.title}</h3>
                    <Badge variant="secondary" className={cn("text-[9px] px-1.5 py-0 rounded capitalize",
                      run.status === "upcoming" ? "bg-emerald-500/20 text-emerald-400" :
                      run.status === "completed" ? "bg-blue-500/20 text-blue-400" :
                      "bg-red-500/20 text-red-400"
                    )}>{run.status}</Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-white/40">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />
                      {new Date(run.scheduledAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {run.meetingPoint && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{run.meetingPoint}</span>}
                    {run.distance && <span className="flex items-center gap-1"><Route className="h-3 w-3" />{run.distance}km</span>}
                    {run.paceGroup && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{run.paceGroup}</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-white/40 flex items-center gap-1">
                      <Users className="h-3 w-3" /> {run.registeredCount}/{run.maxParticipants} joined
                    </span>
                    {run.route && (
                      <span className="text-[10px] text-white/30">via {run.route.title}</span>
                    )}
                  </div>
                </div>
                {run.status === "upcoming" && (
                  <div className="shrink-0 ml-3">
                    {run.isRegistered ? (
                      <Button size="sm" variant="secondary" onClick={() => handleUnregister(run.id)}
                        className="gap-1.5 text-red-400 hover:text-red-300">
                        <XCircle className="h-3 w-3" /> Leave
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => handleRegister(run.id)}
                        className="bg-primary hover:bg-primary/90 gap-1.5">
                        <CheckCircle className="h-3 w-3" /> Join
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
