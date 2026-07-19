"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  Bell,
  Shield,
  Palette,
  Link2,
  Moon,
  Sun,
  Monitor,
  Save,
  Trash2,
} from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

type SettingsSection = "account" | "notifications" | "privacy" | "appearance" | "connections";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const user = useAppStore((s) => s.profile);
  const { updateProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SettingsSection>("account");
  const [formData, setFormData] = useState({
    name: user?.name || "",
    username: user?.username || "",
    email: user?.email || "",
    bio: user?.bio || "",
    location: user?.location || "",
  });
  const [notifSettings, setNotifSettings] = useState({
    emailLikes: true,
    emailComments: true,
    emailFollows: true,
    emailEvents: true,
    pushActivity: true,
    pushMessages: true,
    pushChallenges: true,
    pushSystem: false,
  });
  const [selectedUnit, setSelectedUnit] = useState<"metric" | "imperial">("metric");
  const [preferences, setPreferences] = useState({
    units: "metric" as "metric" | "imperial",
    notificationPreferences: {
      likes: true,
      comments: true,
      follows: true,
      challenges: true,
    },
    privacy: {
      showDistance: true,
      showMap: true,
      showHeartRate: true,
    },
  });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefSaveMessage, setPrefSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    const p = (user as any)?.preferences;
    if (p) {
      setPreferences({
        units: p.units || "metric",
        notificationPreferences: {
          likes: p.notificationPreferences?.likes ?? true,
          comments: p.notificationPreferences?.comments ?? true,
          follows: p.notificationPreferences?.follows ?? true,
          challenges: p.notificationPreferences?.challenges ?? true,
        },
        privacy: {
          showDistance: p.privacy?.showDistance ?? true,
          showMap: p.privacy?.showMap ?? true,
          showHeartRate: p.privacy?.showHeartRate ?? true,
        },
      });
      setSelectedUnit(p.units || "metric");
      setNotifSettings({
        emailLikes: p.notificationPreferences?.likes ?? true,
        emailComments: p.notificationPreferences?.comments ?? true,
        emailFollows: p.notificationPreferences?.follows ?? true,
        emailEvents: p.notificationPreferences?.challenges ?? true,
        pushActivity: true,
        pushMessages: true,
        pushChallenges: true,
        pushSystem: false,
      });
      setPrivacySettings({
        profilePublic: p.privacy?.showMap ?? true,
        showActivities: p.privacy?.showDistance ?? true,
        showStats: p.privacy?.showHeartRate ?? true,
        allowMessages: true,
        showOnLeaderboard: true,
      });
    }
  }, [user]);

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    setPrefSaveMessage(null);
    try {
      const res = await fetch("/api/users/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferences: {
            units: preferences.units,
            notificationPreferences: {
              likes: notifSettings.emailLikes,
              comments: notifSettings.emailComments,
              follows: notifSettings.emailFollows,
              challenges: notifSettings.emailEvents,
            },
            privacy: {
              showDistance: privacySettings.showActivities,
              showMap: privacySettings.profilePublic,
              showHeartRate: privacySettings.showStats,
            },
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save settings");
      setPrefSaveMessage("Settings saved successfully");
    } catch (err) {
      setPrefSaveMessage(
        err instanceof Error ? err.message : "Failed to save settings"
      );
    } finally {
      setSavingPrefs(false);
    }
  };

  const [privacySettings, setPrivacySettings] = useState({
    profilePublic: true,
    showActivities: true,
    showStats: true,
    allowMessages: true,
    showOnLeaderboard: true,
  });

  const sections: { id: SettingsSection; label: string; icon: React.ElementType }[] = [
    { id: "account", label: "Account", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Shield },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "connections", label: "Connected Apps", icon: Link2 },
  ];

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      const result = await updateProfile({
        name: formData.name,
        username: formData.username,
        bio: formData.bio,
        location: formData.location,
      });
      if (result?.error) throw result.error;
      setSaveMessage("Profile saved successfully");
    } catch {
      setSaveMessage("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const ToggleSwitch = ({
    checked,
    onChange,
  }: {
    checked: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
        checked ? "bg-primary" : "bg-muted"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account preferences and settings
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar Nav */}
        <div className="w-full lg:w-56 shrink-0">
          <nav className="flex flex-row gap-1 overflow-x-auto lg:flex-col rounded-xl bg-secondary/30 p-1 lg:p-2">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all whitespace-nowrap cursor-pointer",
                    activeSection === section.id
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {section.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 min-w-0"
        >
          {activeSection === "account" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="text-lg font-semibold">Profile Information</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Update your personal information
                </p>

                <div className="mt-6 flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback>{user?.name?.slice(0, 2) || "U"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <Button variant="outline" size="sm" className="rounded-lg text-xs">
                      Change Avatar
                    </Button>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      JPG, PNG or GIF. Max 2MB.
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {[
                    { label: "Full Name", key: "name" as const, type: "text" },
                    { label: "Username", key: "username" as const, type: "text" },
                    { label: "Email", key: "email" as const, type: "email" },
                    { label: "Location", key: "location" as const, type: "text" },
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="text-xs font-medium text-muted-foreground">
                        {field.label}
                      </label>
                      <input
                        type={field.type}
                        value={formData[field.key]}
                        onChange={(e) =>
                          setFormData({ ...formData, [field.key]: e.target.value })
                        }
                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                      />
                    </div>
                  ))}
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">Bio</label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) =>
                        setFormData({ ...formData, bio: e.target.value })
                      }
                      rows={3}
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary resize-none"
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end gap-3">
                  {saveMessage && (
                    <span className="text-xs text-muted-foreground">{saveMessage}</span>
                  )}
                  <Button
                    className="gap-2 rounded-lg"
                    onClick={handleSaveProfile}
                    disabled={saving}
                  >
                    <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6">
                <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium">Delete Account</p>
                    <p className="text-xs text-muted-foreground">
                      Permanently remove your account and all data
                    </p>
                  </div>
                  <Button variant="destructive" size="sm" className="gap-2 rounded-lg">
                    <Trash2 className="h-4 w-4" /> Delete Account
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeSection === "notifications" && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold">Notification Preferences</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Choose what you want to be notified about
              </p>

              <div className="mt-6 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold mb-3">Email Notifications</h3>
                  <div className="space-y-3">
                    {[
                      { key: "emailLikes" as const, label: "Likes on your activities" },
                      { key: "emailComments" as const, label: "Comments on your activities" },
                      { key: "emailFollows" as const, label: "New followers" },
                      { key: "emailEvents" as const, label: "Event reminders" },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between py-1">
                        <span className="text-sm">{item.label}</span>
                        <ToggleSwitch
                          checked={notifSettings[item.key]}
                          onChange={(v) =>
                            setNotifSettings({ ...notifSettings, [item.key]: v })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <h3 className="text-sm font-semibold mb-3">Push Notifications</h3>
                  <div className="space-y-3">
                    {[
                      { key: "pushActivity" as const, label: "Activity updates" },
                      { key: "pushMessages" as const, label: "New messages" },
                      { key: "pushChallenges" as const, label: "Challenge milestones" },
                      { key: "pushSystem" as const, label: "System announcements" },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between py-1">
                        <span className="text-sm">{item.label}</span>
                        <ToggleSwitch
                          checked={notifSettings[item.key]}
                          onChange={(v) =>
                            setNotifSettings({ ...notifSettings, [item.key]: v })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-border pt-6">
                {prefSaveMessage && (
                  <span className="text-xs text-muted-foreground">{prefSaveMessage}</span>
                )}
                <Button
                  className="gap-2 rounded-lg"
                  onClick={handleSavePreferences}
                  disabled={savingPrefs}
                >
                  <Save className="h-4 w-4" /> {savingPrefs ? "Saving..." : "Save Preferences"}
                </Button>
              </div>
            </div>
          )}

          {activeSection === "privacy" && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold">Privacy Settings</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Control who can see your information
              </p>

              <div className="mt-6 space-y-3">
                {[
                  { key: "profilePublic" as const, label: "Public profile", desc: "Anyone can view your profile" },
                  { key: "showActivities" as const, label: "Show activities", desc: "Display your activities on your profile" },
                  { key: "showStats" as const, label: "Show statistics", desc: "Display your running stats publicly" },
                  { key: "allowMessages" as const, label: "Allow messages", desc: "Let anyone send you messages" },
                  { key: "showOnLeaderboard" as const, label: "Leaderboard visibility", desc: "Appear on public leaderboards" },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between rounded-xl bg-secondary/30 p-4"
                  >
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <ToggleSwitch
                      checked={privacySettings[item.key]}
                      onChange={(v) =>
                        setPrivacySettings({ ...privacySettings, [item.key]: v })
                      }
                    />
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-border pt-6">
                {prefSaveMessage && (
                  <span className="text-xs text-muted-foreground">{prefSaveMessage}</span>
                )}
                <Button
                  className="gap-2 rounded-lg"
                  onClick={handleSavePreferences}
                  disabled={savingPrefs}
                >
                  <Save className="h-4 w-4" /> {savingPrefs ? "Saving..." : "Save Preferences"}
                </Button>
              </div>
            </div>
          )}

          {activeSection === "appearance" && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold">Appearance</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Customize how ZERO6 looks
              </p>

              <div className="mt-6">
                <h3 className="text-sm font-semibold mb-3">Theme</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "light" as const, label: "Light", icon: Sun },
                    { id: "dark" as const, label: "Dark", icon: Moon },
                    { id: "system" as const, label: "System", icon: Monitor },
                  ].map((t) => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-xl border p-4 transition-all cursor-pointer",
                          theme === t.id
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:border-primary/30"
                        )}
                      >
                        <Icon className="h-6 w-6" />
                        <span className="text-xs font-medium">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 border-t border-border pt-6">
                <h3 className="text-sm font-semibold mb-3">Units</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Metric (km)", value: "metric" as const },
                    { label: "Imperial (mi)", value: "imperial" as const },
                  ].map((unit) => (
                    <button
                      key={unit.value}
                      onClick={() => {
                        setSelectedUnit(unit.value);
                        setPreferences({ ...preferences, units: unit.value });
                      }}
                      className={cn(
                        "rounded-xl border p-3 text-sm font-medium transition-all cursor-pointer",
                        selectedUnit === unit.value
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border hover:border-primary/30"
                      )}
                    >
                      {unit.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-border pt-6">
                {prefSaveMessage && (
                  <span className="text-xs text-muted-foreground">{prefSaveMessage}</span>
                )}
                <Button
                  className="gap-2 rounded-lg"
                  onClick={handleSavePreferences}
                  disabled={savingPrefs}
                >
                  <Save className="h-4 w-4" /> {savingPrefs ? "Saving..." : "Save Preferences"}
                </Button>
              </div>
            </div>
          )}

          {activeSection === "connections" && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold">Connected Apps</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Link external services to enhance your experience
              </p>

              <div className="mt-6 space-y-3">
                {[
                  { name: "Strava", desc: "Sync your Strava activities", connected: false, color: "text-orange-500" },
                  { name: "Garmin Connect", desc: "Import from Garmin devices", connected: true, color: "text-blue-600" },
                  { name: "Apple Health", desc: "Sync with Apple Health data", connected: false, color: "text-red-500" },
                  { name: "Google Fit", desc: "Connect your Google Fit data", connected: false, color: "text-green-500" },
                  { name: "Spotify", desc: "Share your running playlists", connected: true, color: "text-emerald-500" },
                ].map((app) => (
                  <div
                    key={app.name}
                    className="flex items-center justify-between rounded-xl border border-border p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-sm font-bold", app.color)}>
                        {app.name.slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{app.name}</p>
                        <p className="text-xs text-muted-foreground">{app.desc}</p>
                      </div>
                    </div>
                    <Button
                      variant={app.connected ? "secondary" : "outline"}
                      size="sm"
                      className="rounded-lg text-xs"
                    >
                      {app.connected ? "Connected" : "Connect"}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
