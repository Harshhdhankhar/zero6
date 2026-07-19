"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Search, Phone, Video, MoreVertical, Smile, Paperclip, Check, CheckCheck, MessageCircle } from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import type { Conversation } from "@/types";

interface ChatMessage {
  id: string;
  content: string;
  sender: "me" | "them";
  time: string;
  read: boolean;
}

export default function MessagesPage() {
  const { data: apiConversations, refetch: refetchConversations } =
    useFetch<Conversation[]>("/api/messages");
  const [selectedConvo, setSelectedConvo] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const conversations = apiConversations || [];

  const filteredConversations = conversations.filter((c) =>
    c.participantName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentConvo = conversations.find((c) => c.id === selectedConvo);

  useEffect(() => {
    if (!selectedConvo) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      setLoadingMessages(true);
      try {
        const res = await fetch(`/api/messages?userId=${selectedConvo}`);
        if (res.ok) {
          const json = await res.json();
          setMessages(json.data || []);
          refetchConversations();
        }
      } catch {
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [selectedConvo, refetchConversations]);

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedConvo) return;

    const content = messageInput.trim();
    setMessageInput("");

    const optimistic: ChatMessage = {
      id: `temp-${Date.now()}`,
      content,
      sender: "me",
      time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      read: false,
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: selectedConvo, content }),
      });
      if (res.ok) {
        const json = await res.json();
        setMessages((prev) =>
          prev.map((m) => (m.id === optimistic.id ? json.data : m))
        );
        refetchConversations();
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-2xl overflow-hidden"
      >
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/50" />
        <div className="relative z-10 p-8 md:p-12">
          <div className="max-w-2xl">
            <div className="badge inline-flex items-center gap-2 mb-4">
              <MessageCircle className="w-3 h-3" />
              Messages
            </div>
            <h1 className="display-heading text-4xl md:text-5xl lg:text-6xl mb-4">
              Connect with <span className="text-gradient">Runners</span>
            </h1>
            <p className="text-lg text-gray-300 mb-6 max-w-lg">
              Chat with fellow runners, share tips, and stay connected with your running community.
            </p>
          </div>
        </div>
      </motion.div>

      <div className="flex h-[calc(100vh-18rem)] overflow-hidden rounded-2xl border border-border glass-strong">
        <div
          className={cn(
            "w-full border-r border-border sm:w-80 flex flex-col shrink-0",
            selectedConvo && "hidden sm:flex"
          )}
        >
          <div className="border-b border-border p-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="input w-full pl-11 pr-4 py-2.5 text-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted">
                No conversations yet
              </p>
            ) : (
              filteredConversations.map((convo) => (
                <button
                  key={convo.id}
                  onClick={() => setSelectedConvo(convo.id)}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary cursor-pointer",
                    selectedConvo === convo.id && "bg-secondary/50"
                  )}
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={convo.participantAvatar} />
                      <AvatarFallback className="font-bold">
                        {convo.participantName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {convo.isOnline && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-[#0A0A0F]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold truncate">{convo.participantName}</p>
                      <span className="text-xs text-muted shrink-0 ml-2">
                        {formatRelativeTime(convo.lastMessageTime)}
                      </span>
                    </div>
                    <p className="text-sm text-muted truncate mt-1">
                      {convo.lastMessage}
                    </p>
                  </div>
                  {convo.unreadCount > 0 && (
                    <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-2 text-xs font-bold text-primary-foreground shrink-0">
                      {convo.unreadCount}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        <div className={cn("flex-1 flex flex-col", !selectedConvo && "hidden sm:flex")}>
          {selectedConvo && currentConvo ? (
            <>
              <div className="flex items-center justify-between border-b border-border px-4 py-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedConvo(null)}
                    className="sm:hidden text-muted hover:text-foreground mr-2 cursor-pointer"
                  >
                    ←
                  </button>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={currentConvo.participantAvatar} />
                    <AvatarFallback className="font-bold">
                      {currentConvo.participantName.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{currentConvo.participantName}</p>
                    <p className="text-xs text-muted">
                      {currentConvo.isOnline ? (
                        <span className="text-green-400">Online</span>
                      ) : (
                        "Offline"
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-secondary">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-secondary">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-secondary">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {loadingMessages ? (
                  <p className="text-center text-sm text-muted py-8">Loading...</p>
                ) : messages.length === 0 ? (
                  <p className="text-center text-sm text-muted py-8">
                    No messages yet. Say hello!
                  </p>
                ) : (
                  messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex",
                        msg.sender === "me" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[75%] rounded-2xl px-5 py-3",
                          msg.sender === "me"
                            ? "bg-primary text-white rounded-br-md"
                            : "bg-secondary/50 text-white rounded-bl-md"
                        )}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <div
                          className={cn(
                            "flex items-center gap-2 mt-2",
                            msg.sender === "me" ? "justify-end" : "justify-start"
                          )}
                        >
                          <span
                            className={cn(
                              "text-xs",
                              msg.sender === "me"
                                ? "text-muted-foreground"
                                : "text-muted-foreground"
                            )}
                          >
                            {msg.time}
                          </span>
                          {msg.sender === "me" &&
                            (msg.read ? (
                              <CheckCheck className="h-3 w-3 text-muted-foreground" />
                            ) : (
                              <Check className="h-3 w-3 text-muted-foreground" />
                            ))}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              <div className="border-t border-border p-4">
                <div className="flex items-center gap-3">
                  <button className="text-muted hover:text-foreground cursor-pointer">
                    <Paperclip className="h-5 w-5" />
                  </button>
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 rounded-xl bg-secondary/30 border border-border px-4 py-3 text-sm outline-none focus:border-primary placeholder:text-muted"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") sendMessage();
                    }}
                  />
                  <button className="text-muted hover:text-foreground cursor-pointer">
                    <Smile className="h-5 w-5" />
                  </button>
                  <Button
                    size="icon"
                    className="h-10 w-10 rounded-xl shrink-0 btn-primary"
                    disabled={!messageInput.trim()}
                    onClick={sendMessage}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted">
              <div className="text-center">
                <p className="text-xl font-semibold mb-2">Select a conversation</p>
                <p className="text-sm">Choose from your existing conversations</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
