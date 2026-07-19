"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, Send, User, Activity, Target, Award, MapPin, Cloud, TrendingUp, PanelLeft, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ConversationSidebar } from "@/components/coach/conversation-sidebar";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  title: string;
  preview?: string;
  updatedAt: string;
  messageCount: number;
  group?: string;
}

const dynamicSuggestions = [
  { icon: Activity, label: "Today's workout", prompt: "What should I do for my run today?" },
  { icon: Target, label: "Weekly progress", prompt: "How am I doing this week?" },
  { icon: MapPin, label: "Nearby clubs", prompt: "Find running clubs near me" },
  { icon: Award, label: "5K plan", prompt: "Create a 4-week 5K training plan" },
  { icon: TrendingUp, label: "Improve pace", prompt: "How can I improve my pace?" },
  { icon: Cloud, label: "Weather run", prompt: "Is it good weather for a run right now?" },
];

function parseMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let inList = false;
  let inTable = false;
  let tableRows: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) {
      if (inList) inList = false;
      if (inTable) {
        elements.push(<div key={`t-${i}`} className="overflow-x-auto my-2"><table className="w-full text-xs border-collapse">{tableRows}</table></div>);
        tableRows = []; inTable = false;
      }
      elements.push(<div key={`e-${i}`} className="h-1.5" />);
      continue;
    }
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      inTable = true;
      const cols = trimmed.split("|").filter(Boolean).map((c) => c.trim());
      const isHeader = lines[i + 1]?.trim().match(/^\|[\s:-]+\|/);
      const Tag = isHeader ? "th" : "td";
      tableRows.push(<tr key={`tr-${i}`}>{cols.map((col, j) => (<Tag key={j} className={cn("border border-border/40 px-3 py-1.5 text-left", isHeader && "font-semibold bg-secondary/30")}>{col.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")}</Tag>))}</tr>);
      if (isHeader) { const n = lines[i + 1]; if (n?.trim().match(/^\|[\s:-]+\|/)) i++; }
      continue;
    }
    if (trimmed.startsWith("> ")) {
      elements.push(<blockquote key={`bq-${i}`} className="border-l-2 border-primary/40 pl-3 py-1 my-2 text-xs italic text-muted-foreground/80 bg-primary/5 rounded-r-lg">{renderInline(trimmed.slice(2))}</blockquote>);
      continue;
    }
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      inList = true;
      elements.push(<li key={`li-${i}`} className="flex items-start gap-2 text-sm leading-relaxed"><span className="text-primary mt-0.5 shrink-0">•</span><span>{renderInline(trimmed.slice(2))}</span></li>);
      continue;
    }
    if (/^\d+\.\s/.test(trimmed)) {
      inList = true;
      const [num, ...rest] = trimmed.split(/\s(.+)/);
      elements.push(<li key={`li-${i}`} className="flex items-start gap-2 text-sm leading-relaxed"><span className="text-primary font-medium mt-0.5 shrink-0 w-5">{num.replace(".", "")}.</span><span>{renderInline(rest.join(""))}</span></li>);
      continue;
    }
    if (trimmed.startsWith("### ")) { elements.push(<h3 key={`h3-${i}`} className="text-sm font-semibold mt-3 mb-1">{renderInline(trimmed.slice(4))}</h3>); continue; }
    if (trimmed.startsWith("## ")) { elements.push(<h2 key={`h2-${i}`} className="text-base font-bold mt-4 mb-1">{renderInline(trimmed.slice(3))}</h2>); continue; }
    if (trimmed.startsWith("# ")) { elements.push(<h1 key={`h1-${i}`} className="text-lg font-bold mt-4 mb-2">{renderInline(trimmed.slice(2))}</h1>); continue; }
    if (trimmed === "<pre>") {
      const codeLines: string[] = []; i++;
      while (i < lines.length && lines[i].trim() !== "</pre>") { codeLines.push(lines[i]); i++; }
      elements.push(<pre key={`code-${i}`} className="bg-black/5 dark:bg-secondary/30 rounded-lg p-3 my-2 overflow-x-auto"><code className="text-[11px] font-mono leading-relaxed">{codeLines.join("\n")}</code></pre>);
      continue;
    }
    elements.push(<p key={`p-${i}`} className="text-sm leading-relaxed">{renderInline(trimmed)}</p>);
  }
  if (inTable && tableRows.length > 0) {
    elements.push(<div key="table-end" className="overflow-x-auto my-2"><table className="w-full text-xs border-collapse">{tableRows}</table></div>);
  }
  return elements;
}

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const boldRegex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0, match: RegExpExecArray | null;
  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    parts.push(<strong key={`b-${match.index}`}>{match[1]}</strong>);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length > 0 ? <>{parts}</> : text;
}

function MessageContent({ text }: { text: string }) {
  return <div className="space-y-0.5">{parseMarkdown(text)}</div>;
}

function TypingDots() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex gap-1">
        {[0, 0.15, 0.3].map((d, i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-primary/60"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, delay: d }}
          />
        ))}
      </div>
    </div>
  );
}

function getGroup(updatedAt: string): string {
  const now = new Date();
  const updated = new Date(updatedAt);
  const diffHours = (now.getTime() - updated.getTime()) / 3600000;
  if (diffHours < 24) return "today";
  if (diffHours < 48) return "yesterday";
  if (diffHours < 168) return "this_week";
  return "earlier";
}

export default function CoachPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, streamingContent, scrollToBottom]);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchConversations() {
    try {
      const res = await fetch("/api/ai-core/conversations");
      if (res.ok) {
        const json = await res.json();
        setConversations((json.data || []).map((c: any) => ({
          id: c.id,
          title: c.title,
          preview: c.preview || (c.messageCount > 0 ? `${c.messageCount} messages` : undefined),
          updatedAt: c.updatedAt,
          messageCount: c.messageCount,
          group: c.group || getGroup(c.updatedAt),
        })));
      }
    } catch {}
  }

  async function loadConversation(id: string) {
    setActiveConversation(id);
    setShowSuggestions(false);
    try {
      const res = await fetch(`/api/ai-core/conversations/${id}`);
      if (res.ok) {
        const json = await res.json();
        setMessages((json.data || []).map((m: any) => ({
          id: m.id,
          role: m.role === "user" ? "user" : "assistant",
          content: m.content,
          timestamp: m.createdAt,
        })));
      }
    } catch {}
  }

  async function handleNewConversation() {
    setActiveConversation(null);
    setMessages([]);
    setShowSuggestions(true);
    setStreamingContent("");
    inputRef.current?.focus();
  }

  async function handleRename(id: string, title: string) {
    try {
      await fetch(`/api/ai-core/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));
    } catch {}
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/ai-core/conversations/${id}`, { method: "DELETE" });
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversation === id) { setActiveConversation(null); setMessages([]); setShowSuggestions(true); }
    } catch {}
  }

  async function sendMessage(content: string) {
    if (!content.trim() || isStreaming) return;
    setInput("");
    setShowSuggestions(false);

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: content.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    setIsStreaming(true);
    setStreamingContent("");

    try {
      const res = await fetch("/api/ai-core/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content.trim(), conversationId: activeConversation || undefined }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        setMessages((prev) => [...prev, { id: `msg-${Date.now() + 1}`, role: "assistant", content: err.error || "Something went wrong. Please try again.", timestamp: new Date().toISOString() }]);
        setIsStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) { setIsStreaming(false); return; }

      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";
      let resultConvId = activeConversation;
      let hadContent = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const { type, data } = JSON.parse(line.slice(6));
            if (type === "token") {
              hadContent = true;
              fullContent += data;
              setStreamingContent(fullContent);
            } else if (type === "action" && data?.text) {
              fullContent += (fullContent ? "\n\n" : "") + data.text;
              setStreamingContent(fullContent);
            } else if (type === "done") {
              resultConvId = data.conversationId || resultConvId;
            }
          } catch {}
        }
      }

      if (resultConvId) {
        const isNew = !activeConversation || activeConversation !== resultConvId;
        setActiveConversation(resultConvId);
        if (isNew) await fetchConversations();
        setMessages([]);
        await loadConversation(resultConvId);
      }
    } catch {
      setMessages((prev) => [...prev, { id: `msg-${Date.now() + 1}`, role: "assistant", content: "Let me try that again.", timestamp: new Date().toISOString() }]);
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
    }
  }

  return (
    <div className="h-full flex">
      <ConversationSidebar
        conversations={conversations}
        activeId={activeConversation}
        onSelect={loadConversation}
        onNew={handleNewConversation}
        onRename={handleRename}
        onDelete={handleDelete}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-b from-background via-background to-background/95">
        <div className="flex items-center gap-3 px-5 pt-5 pb-0 shrink-0">
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors cursor-pointer -ml-1">
            <PanelLeft className="h-4 w-4" />
          </button>
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-accent to-primary shadow-lg shadow-primary/20">
            <Bot className="h-5 w-5 text-white relative z-10" />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary via-accent to-primary opacity-40 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">ZERO</h1>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-accent" />
              Your running companion
            </p>
          </div>
        </div>

        <div className="flex-1 flex flex-col mx-3 my-3 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/40 shadow-lg shadow-black/5 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}
                >
                  {msg.role === "assistant" && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent mt-0.5 shadow-sm">
                      <Bot className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                  <div className={cn("max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm transition-all", msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-card/80 rounded-bl-md border border-border/20 backdrop-blur-sm")}>
                    <MessageContent text={msg.content} />
                  </div>
                  {msg.role === "user" && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary mt-0.5">
                      <User className="h-3.5 w-3.5" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {isStreaming && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent mt-0.5 shadow-sm">
                  <Bot className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="rounded-2xl bg-card/80 px-4 py-2.5 rounded-bl-md border border-border/20 backdrop-blur-sm">
                  {streamingContent ? (
                    <><MessageContent text={streamingContent} /><span className="inline-block w-1.5 h-3.5 bg-primary/60 ml-0.5 animate-pulse rounded-sm" /></>
                  ) : (
                    <div className="flex items-center gap-2.5"><TypingDots /></div>
                  )}
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {showSuggestions && messages.length === 0 && !isStreaming && (
            <div className="px-4 pb-2">
              <div className="rounded-xl bg-gradient-to-br from-primary/[0.03] to-accent/[0.03] border border-primary/10 p-4">
                <p className="text-xs text-muted-foreground mb-3 font-medium flex items-center gap-1.5"><Sparkles className="h-3 w-3 text-accent" />What would you like to do?</p>
                <div className="flex flex-wrap gap-2">
                  {dynamicSuggestions.map((s) => {
                    const Icon = s.icon;
                    return (
                      <button key={s.label} onClick={() => sendMessage(s.prompt)}
                        className="flex items-center gap-1.5 rounded-lg bg-secondary/50 hover:bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-all cursor-pointer border border-border/20 hover:border-border/40"
                      ><Icon className="h-3 w-3" />{s.label}</button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-border/20 p-3 bg-gradient-to-t from-card/50 to-transparent">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                  placeholder="Ask ZERO anything..."
                  className="w-full rounded-xl bg-secondary/40 pl-4 pr-4 py-2.5 text-sm outline-none transition-all focus:bg-secondary/60 focus:ring-1 focus:ring-primary/20 placeholder:text-muted-foreground/60"
                  disabled={isStreaming}
                />
              </div>
              <Button size="icon" className={cn("h-10 w-10 rounded-xl shrink-0 transition-all", input.trim() && !isStreaming && "shadow-lg shadow-primary/20")}
                disabled={!input.trim() || isStreaming} onClick={() => sendMessage(input)}
              ><Send className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
