"use client";

import { useState, useCallback } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { useAuth } from "@/hooks/use-auth";
import {
  Heart, MessageSquare, Pin, Trash2, Send,
  Loader2, AlertCircle, RefreshCw, User,
  ThumbsUp, Flame, PartyPopper,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface FeedPost {
  id: string; content: string; imageUrl: string; videoUrl: string;
  postType: string; isPinned: boolean; likesCount: number; commentsCount: number;
  tags: string[]; createdAt: string;
  user: { id: string; name: string; username: string; avatar: string } | null;
  isLiked: boolean; comments: any[];
}

const REACTIONS = [
  { type: "like", icon: ThumbsUp, label: "Like" },
  { type: "love", icon: Heart, label: "Love" },
  { type: "fire", icon: Flame, label: "Fire" },
  { type: "cheers", icon: PartyPopper, label: "Cheers" },
];

export function CommunityFeed({ clubId, isAdmin }: { clubId: string; isAdmin: boolean }) {
  const { isAuthenticated } = useAuth();
  const { data, loading, error, refetch } = useFetch<{ data: FeedPost[]; meta: any }>(`/api/clubs/${clubId}/feed`);
  const posts = data?.data || [];
  const [newPost, setNewPost] = useState("");
  const [posting, setPosting] = useState(false);
  const [likingId, setLikingId] = useState<string | null>(null);
  const [commentId, setCommentId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  const handlePost = useCallback(async () => {
    if (!isAuthenticated) { toast.error("Sign in to post"); return; }
    if (!newPost.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/clubs/${clubId}/feed`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newPost }),
      });
      if (!res.ok) throw new Error("Failed to post");
      setNewPost("");
      toast.success("Posted!");
      refetch();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setPosting(false);
    }
  }, [clubId, newPost, isAuthenticated, refetch]);

  const handleLike = useCallback(async (postId: string, isLiked: boolean) => {
    if (!isAuthenticated) { toast.error("Sign in to like"); return; }
    setLikingId(postId);
    try {
      await fetch(`/api/clubs/${clubId}/feed/${postId}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: isLiked ? "unlike" : "like" }),
      });
      refetch();
    } catch { } finally { setLikingId(null); }
  }, [clubId, isAuthenticated, refetch]);

  const handlePin = useCallback(async (postId: string, pinned: boolean) => {
    if (!isAuthenticated) { toast.error("Sign in to manage posts"); return; }
    try {
      const res = await fetch(`/api/clubs/${clubId}/feed/${postId}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pin", pinned: !pinned }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(pinned ? "Unpinned" : "Pinned");
      refetch();
    } catch { toast.error("Failed"); }
  }, [clubId, isAuthenticated, refetch]);

  const handleDelete = useCallback(async (postId: string) => {
    if (!isAuthenticated) { toast.error("Sign in to delete"); return; }
    if (!confirm("Delete this post?")) return;
    try {
      const res = await fetch(`/api/clubs/${clubId}/feed/${postId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Deleted");
      refetch();
    } catch { toast.error("Failed to delete"); }
  }, [clubId, isAuthenticated, refetch]);

  const handleComment = useCallback(async (postId: string) => {
    if (!isAuthenticated) { toast.error("Sign in to comment"); return; }
    if (!commentText.trim() || commentId !== postId) return;
    try {
      const res = await fetch(`/api/clubs/${clubId}/feed/${postId}/comments`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentText }),
      });
      if (!res.ok) throw new Error("Failed");
      setCommentText("");
      setCommentId(null);
      toast.success("Commented");
      refetch();
    } catch { toast.error("Failed to comment"); }
  }, [clubId, commentId, commentText, isAuthenticated, refetch]);

  if (loading) {
    return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <AlertCircle className="h-8 w-8 text-red-400 mb-2" />
        <p className="text-sm text-white/60">Failed to load feed</p>
        <Button variant="secondary" size="sm" onClick={refetch} className="mt-3 gap-2"><RefreshCw className="h-3 w-3" /> Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Create Post */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-white/[0.03] p-4">
        <textarea value={newPost} onChange={e => setNewPost(e.target.value)} rows={3}
          placeholder="Share something with the community..."
          className="w-full bg-transparent text-sm text-white placeholder:text-white/30 resize-none focus:outline-none" />
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <div />
          <Button onClick={handlePost} disabled={!newPost.trim() || posting} size="sm" className="rounded-xl bg-primary hover:bg-primary/90 gap-2">
            {posting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Post
          </Button>
        </div>
      </motion.div>

      {posts.length === 0 && (
        <div className="flex flex-col items-center py-12 text-center">
          <MessageSquare className="h-10 w-10 text-white/20 mb-2" />
          <p className="text-sm text-white/40">No posts yet. Be the first to share!</p>
        </div>
      )}

      {posts.map((post) => (
        <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className={cn("rounded-2xl border border-border bg-white/[0.03] overflow-hidden",
            post.isPinned && "border-primary/30 bg-primary/[0.02]")}>
          {/* Header */}
          <div className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {post.user?.avatar ? (
                  <img src={post.user.avatar} alt="" className="w-8 h-8 rounded-xl object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-white">{post.user?.name || "Member"}</p>
                  <p className="text-[10px] text-white/30">{new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {post.isPinned && <Pin className="h-3.5 w-3.5 text-primary" />}
                {isAdmin && (
                  <div className="flex gap-1">
                    <button onClick={() => handlePin(post.id, post.isPinned)}
                      className="p-1.5 rounded-lg hover:bg-secondary/50 text-white/30 hover:text-white/60 transition-all cursor-pointer" title="Pin/Unpin">
                      <Pin className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDelete(post.id)}
                      className="p-1.5 rounded-lg hover:bg-secondary/50 text-white/30 hover:text-red-400 transition-all cursor-pointer" title="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          {post.content && (
            <div className="px-4 pb-3">
              <p className="text-sm text-white/80 whitespace-pre-wrap">{post.content}</p>
            </div>
          )}
          {post.imageUrl && (
            <div className="px-4 pb-3">
              <img src={post.imageUrl} alt="" className="w-full rounded-xl object-cover max-h-80" />
            </div>
          )}

          {/* Actions */}
          <div className="px-4 pb-3 flex items-center gap-4">
            <button onClick={() => handleLike(post.id, post.isLiked)} disabled={likingId === post.id}
              className={cn("flex items-center gap-1.5 text-xs transition-all cursor-pointer",
                post.isLiked ? "text-primary" : "text-white/40 hover:text-white/60")}>
              {likingId === post.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Heart className={cn("h-3.5 w-3.5", post.isLiked && "fill-current")} />}
              {post.likesCount || 0}
            </button>
            <button onClick={() => setCommentId(commentId === post.id ? null : post.id)}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/60 transition-all cursor-pointer">
              <MessageSquare className="h-3.5 w-3.5" /> {post.commentsCount || 0}
            </button>
          </div>

          {/* Comments */}
          {commentId === post.id && (
            <div className="border-t border-border px-4 py-3 space-y-3">
              {post.comments?.length > 0 && (
                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {post.comments.map((c: any) => (
                    <div key={c.id} className="flex items-start gap-2">
                      {c.user?.avatar ? <img src={c.user.avatar} alt="" className="w-5 h-5 rounded-lg object-cover mt-0.5" />
                        : <div className="w-5 h-5 rounded-lg bg-secondary/50 flex items-center justify-center"><User className="h-3 w-3 text-white/40" /></div>}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white">{c.user?.name || "Member"}</p>
                        <p className="text-[11px] text-white/60">{c.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input value={commentText} onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleComment(post.id)}
                  placeholder="Write a comment..." className="flex-1 h-8 bg-secondary/30 rounded-lg text-xs text-white placeholder:text-white/30 px-3 focus:outline-none focus:ring-1 focus:ring-primary/30" />
                <button onClick={() => handleComment(post.id)} disabled={!commentText.trim()}
                  className="p-1.5 rounded-lg text-white/40 hover:text-primary disabled:opacity-30 transition-all cursor-pointer">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
