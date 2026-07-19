"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { useAuth } from "@/hooks/use-auth";
import {
  Send, Smile, Reply, Pin, Megaphone, Hash, Plus,
  Loader2, AlertCircle, RefreshCw, User, ChevronDown,
  Settings, Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { actions } from "@/lib/actions";

interface Channel {
  id: string; name: string; description: string; icon: string;
  isDefault: boolean; isAnnouncementOnly: boolean; position: number;
}

interface ChatMessage {
  id: string; content: string; imageUrl: string; gifUrl: string;
  channelId: string; isAnnouncement: boolean; isPinned: boolean;
  reactions: Record<string, string[]>; mentions: string[];
  createdAt: string;
  user: { id: string; name: string; username: string; avatar: string } | null;
  replyTo: { id: string; content: string; userName: string } | null;
}

export function CommunityChat({ clubId, isAdmin }: { clubId: string; isAdmin: boolean }) {
  const { isAuthenticated, profile } = useAuth();
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [showChannelList, setShowChannelList] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [creatingChannel, setCreatingChannel] = useState(false);

  const { data: channelsData, loading: channelsLoading, refetch: refetchChannels } = useFetch<{ data: Channel[] }>(
    `/api/clubs/${clubId}/channels`
  );
  const channels = channelsData?.data || [];

  const { data, loading, error, refetch } = useFetch<{ data: ChatMessage[] }>(
    `/api/clubs/${clubId}/community?resource=chat${activeChannel?.id ? `&channelId=${activeChannel.id}` : ""}`
  );
  const messages = data?.data || [];

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; content: string; userName: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (channels.length > 0 && !activeChannel) {
      const defaultChannel = channels.find(ch => ch.isDefault) || channels[0];
      setActiveChannel(defaultChannel);
    }
  }, [channels, activeChannel]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSend = useCallback(async () => {
    if (!text.trim() || !activeChannel) return;
    setSending(true);
    try {
      const res = await fetch(`/api/clubs/${clubId}/community`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resource: "chat",
          content: text,
          channelId: activeChannel.id,
          replyTo: replyTo?.id || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to send");
      setText("");
      setReplyTo(null);
      refetch();
    } catch (err: any) { toast.error(err.message); }
    finally { setSending(false); }
  }, [clubId, text, replyTo, activeChannel, refetch]);

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) return;
    setCreatingChannel(true);
    try {
      await actions.createChannel(clubId, { name: newChannelName.trim() });
      setNewChannelName("");
      setShowCreateChannel(false);
      refetchChannels();
      toast.success("Channel created");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreatingChannel(false);
    }
  };

  const handleDeleteChannel = async (channelId: string) => {
    if (!confirm("Delete this channel? Messages will be lost.")) return;
    try {
      await actions.deleteChannel(clubId, channelId);
      if (activeChannel?.id === channelId) {
        setActiveChannel(channels.find(ch => ch.id !== channelId) || null);
      }
      refetchChannels();
      toast.success("Channel deleted");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (channelsLoading) return <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>;

  if (error) return (
    <div className="flex flex-col items-center py-12 text-center">
      <AlertCircle className="h-8 w-8 text-red-400 mb-2" />
      <p className="text-sm text-white/60">Failed to load chat</p>
      <Button variant="secondary" size="sm" onClick={refetch} className="mt-3 gap-2"><RefreshCw className="h-3 w-3" /> Retry</Button>
    </div>
  );

  const pinned = messages.filter(m => m.isPinned);

  return (
    <div className="flex h-[500px] sm:h-[600px] rounded-2xl border border-border bg-white/[0.02] overflow-hidden">
      {/* Channel Sidebar */}
      <div className="hidden sm:flex w-48 border-r border-border flex-col">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Channels</span>
          {isAdmin && (
            <button onClick={() => setShowCreateChannel(true)}
              className="p-1 rounded-lg hover:bg-secondary text-white/40 hover:text-white/60 transition-all cursor-pointer">
              <Plus className="h-3 w-3" />
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {channels.map((ch) => (
            <button key={ch.id}
              onClick={() => setActiveChannel(ch)}
              className={cn(
                "w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-left transition-all cursor-pointer group",
                activeChannel?.id === ch.id ? "bg-secondary/50 text-white" : "text-white/40 hover:text-white/60 hover:bg-secondary/50"
              )}>
              <span className="text-xs">{ch.icon}</span>
              <span className="text-[11px] truncate flex-1">{ch.name}</span>
              {isAdmin && !ch.isDefault && (
                <button onClick={(e) => { e.stopPropagation(); handleDeleteChannel(ch.id); }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-secondary text-white/20 hover:text-red-400 transition-all cursor-pointer">
                  <Trash2 className="h-2.5 w-2.5" />
                </button>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Channel Selector */}
      <div className="sm:hidden shrink-0 p-2 border-b border-border">
        <button onClick={() => setShowChannelList(!showChannelList)}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-secondary/30 text-white/60 text-xs cursor-pointer">
          <span>{activeChannel?.icon || "#"}</span>
          <span>{activeChannel?.name || "Select channel"}</span>
          <ChevronDown className="h-3 w-3" />
        </button>
        <AnimatePresence>
          {showChannelList && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-1 space-y-0.5">
              {channels.map((ch) => (
                <button key={ch.id}
                  onClick={() => { setActiveChannel(ch); setShowChannelList(false); }}
                  className={cn(
                    "w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-left transition-all cursor-pointer",
                    activeChannel?.id === ch.id ? "bg-secondary/50 text-white" : "text-white/40 hover:text-white/60"
                  )}>
                  <span className="text-xs">{ch.icon}</span>
                  <span className="text-[11px]">{ch.name}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Channel Header */}
        <div className="shrink-0 px-4 py-2.5 border-b border-border flex items-center gap-2">
          <span className="text-sm">{activeChannel?.icon || "#"}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{activeChannel?.name || "general"}</p>
            {activeChannel?.description && (
              <p className="text-[9px] text-white/30 truncate">{activeChannel.description}</p>
            )}
          </div>
          {activeChannel?.isAnnouncementOnly && (
            <Megaphone className="h-3 w-3 text-primary" />
          )}
        </div>

        {/* Pinned Banner */}
        {pinned.length > 0 && (
          <div className="shrink-0 px-4 py-2 bg-primary/5 border-b border-primary/20 flex items-center gap-2">
            <Pin className="h-3 w-3 text-primary" />
            <p className="text-[11px] text-white/60 truncate">{pinned[0].content}</p>
          </div>
        )}

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Smile className="h-8 w-8 text-white/20 mb-2" />
              <p className="text-sm text-white/40">No messages yet. Say hello!</p>
            </div>
          )}
          {messages.map((msg) => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={cn("flex items-start gap-2.5", msg.isAnnouncement && "bg-primary/5 -mx-4 px-4 py-2 border-y border-primary/10")}>
              {msg.user?.avatar ? (
                <img src={msg.user.avatar} alt="" className="w-7 h-7 rounded-lg object-cover shrink-0 mt-0.5" />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="h-3.5 w-3.5 text-white/40" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-white">{msg.user?.name || "Member"}</span>
                  {msg.isAnnouncement && <Megaphone className="h-3 w-3 text-primary" />}
                  {msg.isPinned && <Pin className="h-3 w-3 text-white/30" />}
                  <span className="text-[9px] text-white/30">{new Date(msg.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                {msg.replyTo && (
                  <div className="text-[10px] text-white/30 border-l-2 border-border pl-2 mb-1 italic">
                    Replying to {msg.replyTo.userName}: {msg.replyTo.content?.slice(0, 50)}
                  </div>
                )}
                {msg.content && <p className="text-xs text-white/80">{msg.content}</p>}
                {msg.imageUrl && <img src={msg.imageUrl} alt="" className="mt-1 max-w-[200px] rounded-xl" />}
                <div className="flex items-center gap-2 mt-1">
                  <button onClick={() => setReplyTo({ id: msg.id, content: msg.content || "", userName: msg.user?.name || "Member" })}
                    className="text-[9px] text-white/20 hover:text-white/40 transition-all cursor-pointer">
                    Reply
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Reply Indicator */}
        {replyTo && (
          <div className="shrink-0 px-4 py-1.5 bg-secondary/30 border-t border-border flex items-center justify-between">
            <span className="text-[10px] text-white/40 flex items-center gap-1">
              <Reply className="h-3 w-3" /> Replying to <strong className="text-white/60">{replyTo.userName}</strong>
            </span>
            <button onClick={() => setReplyTo(null)} className="text-white/20 hover:text-white/40 text-xs cursor-pointer">✕</button>
          </div>
        )}

        {/* Input */}
        <div className="shrink-0 p-3 border-t border-border">
          <div className="flex items-center gap-2">
            <input value={text} onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              placeholder={`Message #${activeChannel?.name || "general"}...`}
              disabled={!activeChannel}
              className="flex-1 bg-secondary/30 rounded-xl text-xs text-white placeholder:text-white/30 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/30 border border-border disabled:opacity-30" />
            <button onClick={handleSend} disabled={!text.trim() || sending || !activeChannel}
              className="p-2 rounded-xl bg-primary hover:bg-primary/90 text-white disabled:opacity-30 transition-all cursor-pointer">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Create Channel Modal */}
      <AnimatePresence>
        {showCreateChannel && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setShowCreateChannel(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="w-full max-w-sm bg-[#0A0A0A] border border-border rounded-2xl p-5"
              onClick={e => e.stopPropagation()}>
              <h3 className="text-sm font-medium text-white mb-4">Create Channel</h3>
              <input value={newChannelName} onChange={e => setNewChannelName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCreateChannel()}
                placeholder="channel-name"
                className="w-full bg-secondary/30 rounded-xl text-xs text-white placeholder:text-white/30 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/30 border border-border mb-4" />
              <div className="flex gap-2 justify-end">
                <Button variant="secondary" size="sm" onClick={() => setShowCreateChannel(false)}>Cancel</Button>
                <Button size="sm" onClick={handleCreateChannel} disabled={!newChannelName.trim() || creatingChannel}
                  className="bg-primary hover:bg-primary/90">
                  {creatingChannel ? <Loader2 className="h-3 w-3 animate-spin" /> : "Create"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
