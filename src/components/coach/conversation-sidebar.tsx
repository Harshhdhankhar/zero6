"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, MessageSquare, Trash2, Check, X, Search, PanelLeftClose, MoreHorizontal, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  title: string;
  preview?: string;
  updatedAt: string;
  messageCount: number;
  group?: string;
}

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const groupLabels: Record<string, string> = {
  today: "Today",
  yesterday: "Yesterday",
  this_week: "This Week",
  earlier: "Earlier",
};

export function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onRename,
  onDelete,
  collapsed,
  onToggleCollapse,
}: ConversationSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const editRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && editRef.current) editRef.current.focus();
  }, [editingId]);

  useEffect(() => {
    const close = () => setContextMenu(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  function saveEdit() {
    if (editingId && editValue.trim()) onRename(editingId, editValue.trim());
    setEditingId(null);
  }

  const filtered = searchQuery
    ? conversations.filter((c) => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : conversations;

  const grouped = filtered.reduce((acc, conv) => {
    const g = conv.group || "earlier";
    if (!acc[g]) acc[g] = [];
    acc[g].push(conv);
    return acc;
  }, {} as Record<string, Conversation[]>);

  return (
    <motion.div
      animate={{ width: collapsed ? 0 : 300 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "relative h-full flex flex-col bg-card/95 border-r border-border/50 overflow-hidden shrink-0",
        collapsed && "border-0"
      )}
    >
      <div className="flex items-center gap-2 p-3 border-b border-border/30">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent shadow-sm">
            <MessageCircle className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Conversations</span>
        </div>
        <button onClick={onNew} className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors cursor-pointer" title="New conversation">
          <Plus className="h-4 w-4" />
        </button>
        <button onClick={onToggleCollapse} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors cursor-pointer">
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      <div className="px-3 pt-3 pb-1">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full rounded-lg bg-secondary/50 pl-8 pr-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary/20 placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-3 scroll-smooth">
        {Object.entries(grouped).map(([group, convs]) => (
          <div key={group}>
            <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest">
              {groupLabels[group] || group}
            </div>
            <div className="space-y-0.5">
              <AnimatePresence initial={false}>
                {convs.map((conv) => (
                  <motion.div
                    key={conv.id}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="group relative"
                  >
                    {confirmDelete === conv.id ? (
                      <div className="flex items-center gap-1 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2.5 mx-1">
                        <span className="text-xs text-destructive flex-1">Delete?</span>
                        <button onClick={() => { onDelete(conv.id); setConfirmDelete(null); }} className="p-1 rounded hover:bg-destructive/20 text-destructive cursor-pointer">
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setConfirmDelete(null)} className="p-1 rounded hover:bg-muted cursor-pointer">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : editingId === conv.id ? (
                      <input
                        ref={editRef}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditingId(null); }}
                        className="w-full rounded-lg bg-muted border border-border px-3 py-2 text-sm outline-none mx-1"
                      />
                    ) : (
                      <button
                        onClick={() => onSelect(conv.id)}
                        onContextMenu={(e) => { e.preventDefault(); setContextMenu({ id: conv.id, x: e.clientX, y: e.clientY }); }}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-all cursor-pointer mx-1",
                          activeId === conv.id
                            ? "bg-primary/10 text-primary font-medium shadow-sm"
                            : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                        )}
                      >
                        <MessageSquare className={cn("h-4 w-4 shrink-0", activeId === conv.id ? "text-primary" : "text-muted-foreground/60")} />
                        <div className="min-w-0 flex-1">
                          <p className={cn("truncate text-sm", activeId === conv.id && "text-primary")}>
                            {conv.title}
                          </p>
                          {conv.preview && (
                            <p className="truncate text-[11px] text-muted-foreground/50 mt-0.5">{conv.preview}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); setContextMenu({ id: conv.id, x: e.clientX, y: e.clientY }); }}
                            className="p-1 rounded hover:bg-secondary transition-colors cursor-pointer"
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/50">
            <MessageSquare className="h-8 w-8 mb-2" />
            <p className="text-xs">No conversations yet</p>
          </div>
        )}
      </div>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-50 w-40 rounded-xl border border-border bg-card shadow-2xl p-1"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={() => setContextMenu(null)}
          >
            {[
              { icon: Trash2, label: "Delete", action: () => setConfirmDelete(contextMenu.id), className: "text-red-400 hover:bg-red-500/10" },
            ].map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className={cn("flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors cursor-pointer", item.className || "hover:bg-secondary")}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
