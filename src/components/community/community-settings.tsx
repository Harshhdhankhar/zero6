"use client";

import { useState, useEffect } from "react";
import { useFetch } from "@/hooks/use-fetch";
import {
  Settings, Save, Loader2, AlertCircle, RefreshCw,
  MessageSquare, Camera, Calendar, Route, Users, Shield,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { actions } from "@/lib/actions";

interface CommunitySettings {
  clubId: string;
  defaultChannelId: string | null;
  welcomeMessage: string;
  autoApproveMembers: boolean;
  allowMemberPosts: boolean;
  allowMemberEvents: boolean;
  allowMemberChallenges: boolean;
  requirePostApproval: boolean;
}

export function CommunitySettings({ clubId }: { clubId: string }) {
  const { data, loading, error, refetch } = useFetch<{ data: CommunitySettings }>(
    `/api/clubs/${clubId}/settings`
  );
  const settings = data?.data;

  const [form, setForm] = useState<Partial<CommunitySettings>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await actions.updateCommunitySettings(clubId, form);
      refetch();
      toast.success("Settings saved");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>;

  if (error) return (
    <div className="flex flex-col items-center py-12 text-center">
      <AlertCircle className="h-8 w-8 text-red-400 mb-2" />
      <p className="text-sm text-white/60">Failed to load settings</p>
      <Button variant="secondary" size="sm" onClick={refetch} className="mt-3 gap-2"><RefreshCw className="h-3 w-3" /> Retry</Button>
    </div>
  );

  const Toggle = ({ label, icon: Icon, value, onChange }: { label: string; icon: any; value: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-border">
      <div className="flex items-center gap-2.5">
        <Icon className="h-4 w-4 text-white/40" />
        <span className="text-xs text-white/80">{label}</span>
      </div>
      <button onClick={() => onChange(!value)}
        className={cn("w-9 h-5 rounded-full transition-all cursor-pointer relative",
          value ? "bg-primary" : "bg-secondary/50")}>
        <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
          value ? "left-[18px]" : "left-0.5")} />
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Community Settings</h3>
        <Button size="sm" onClick={handleSave} disabled={saving}
          className="bg-primary hover:bg-primary/90 gap-1.5">
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
          Save
        </Button>
      </div>

      <div className="space-y-2">
        <Toggle label="Auto-approve new members" icon={Shield}
          value={form.autoApproveMembers ?? true}
          onChange={(v) => setForm({ ...form, autoApproveMembers: v })} />

        <Toggle label="Allow members to create posts" icon={MessageSquare}
          value={form.allowMemberPosts ?? true}
          onChange={(v) => setForm({ ...form, allowMemberPosts: v })} />

        <Toggle label="Allow members to create events" icon={Calendar}
          value={form.allowMemberEvents ?? false}
          onChange={(v) => setForm({ ...form, allowMemberEvents: v })} />

        <Toggle label="Allow members to create challenges" icon={Users}
          value={form.allowMemberChallenges ?? false}
          onChange={(v) => setForm({ ...form, allowMemberChallenges: v })} />

        <Toggle label="Require post approval before publishing" icon={Shield}
          value={form.requirePostApproval ?? false}
          onChange={(v) => setForm({ ...form, requirePostApproval: v })} />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] text-white/40 uppercase tracking-wider">Welcome Message</label>
        <textarea value={form.welcomeMessage || ""} rows={3}
          onChange={e => setForm({ ...form, welcomeMessage: e.target.value })}
          placeholder="Message shown to new members when they join..."
          className="w-full bg-secondary/30 rounded-xl text-xs text-white placeholder:text-white/30 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/30 border border-border resize-none" />
      </div>
    </div>
  );
}
