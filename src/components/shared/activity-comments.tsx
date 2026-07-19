"use client";

import React, { useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppStore } from "@/store/app-store";
import { formatRelativeTime } from "@/lib/utils";

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: string;
}

interface ActivityCommentsProps {
  activityId: string;
  commentCount: number;
}

export function ActivityComments({ activityId, commentCount }: ActivityCommentsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [newComment, setNewComment] = useState("");
  const currentUser = useAppStore((s) => s.profile);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/activities/${activityId}/comments`);
      const json = await res.json();
      setComments(json.data || []);
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = () => {
    if (!isOpen && comments.length === 0) {
      fetchComments();
    }
    setIsOpen(!isOpen);
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsPosting(true);
    try {
      const res = await fetch(`/api/activities/${activityId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });
      const json = await res.json();
      if (json.data) {
        setComments([...comments, json.data]);
        setNewComment("");
      }
    } catch {
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="mt-4 border-t border-border pt-4">
      <button
        onClick={handleToggle}
        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <MessageCircle className="h-3.5 w-3.5" />
        {commentCount} {commentCount === 1 ? "Comment" : "Comments"}
      </button>

      {isOpen && (
        <div className="mt-4 space-y-4">
          {/* Comments List */}
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="text-xs text-muted-foreground text-center py-4">
                Loading comments...
              </div>
            ) : comments.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-4">
                No comments yet. Be the first to comment!
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={comment.userAvatar} alt={comment.userName} />
                    <AvatarFallback className="text-xs">
                      {comment.userName.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">{comment.userName}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatRelativeTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{comment.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add Comment Form */}
          <form onSubmit={handlePostComment} className="flex gap-2">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={currentUser?.avatar} alt={currentUser?.name} />
              <AvatarFallback className="text-xs">
                {currentUser?.name.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 relative">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary placeholder:text-muted-foreground"
                disabled={isPosting}
              />
              {newComment && (
                <button
                  type="button"
                  onClick={() => setNewComment("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <Button
              type="submit"
              size="sm"
              className="shrink-0 h-8 px-3 rounded-lg"
              disabled={!newComment.trim() || isPosting}
            >
              {isPosting ? (
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Send className="h-3 w-3" />
              )}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
