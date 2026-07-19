"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, FolderOpen, ImageIcon, Lock, Globe, Loader2 } from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Collection {
  id: string;
  title: string;
  description: string | null;
  coverPhotoUrl: string | null;
  isPublic: boolean;
  type: string;
  routeCount: number;
  createdAt: string;
}

export default function CollectionsPage() {
  const { data: collections, loading, error, refetch } = useFetch<Collection[]>("/api/collections");
  const [showCreate, setShowCreate] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createType, setCreateType] = useState("custom");
  const [createPublic, setCreatePublic] = useState(true);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!createTitle.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: createTitle,
          description: createDesc || undefined,
          type: createType,
          isPublic: createPublic,
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        setCreateTitle("");
        setCreateDesc("");
        setCreateType("custom");
        setCreatePublic(true);
        refetch();
      }
    } catch {} finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Collections</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize your favorite routes
          </p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <Button className="gap-2" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            New Collection
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Collection</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Title</label>
                <Input
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  placeholder="My favorite routes"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
                <Input
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  placeholder="A collection of my best runs"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
                <select
                  value={createType}
                  onChange={(e) => setCreateType(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="favorites">Favorites</option>
                  <option value="weekend">Weekend</option>
                  <option value="training">Training</option>
                  <option value="hill">Hill</option>
                  <option value="distance">Distance</option>
                  <option value="time_of_day">Time of Day</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={createPublic}
                  onChange={(e) => setCreatePublic(e.target.checked)}
                  className="rounded border-border"
                />
                <label htmlFor="isPublic" className="text-sm text-muted-foreground">
                  Make this collection public
                </label>
              </div>
              <Button
                onClick={handleCreate}
                disabled={!createTitle.trim() || creating}
                className="w-full gap-2"
              >
                {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Collection
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Loader2 className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={refetch} className="mt-3">
            Retry
          </Button>
        </div>
      ) : !collections || collections.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <FolderOpen className="mb-3 h-12 w-12 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No collections yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Create your first collection to organize routes
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((collection) => (
            <Link key={collection.id} href={`/collections/${collection.id}`}>
              <motion.div
                whileHover={{ y: -4 }}
                className="group rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20"
              >
                <div className="relative h-32 bg-gradient-to-br from-secondary to-muted flex items-center justify-center overflow-hidden">
                  {collection.coverPhotoUrl ? (
                    <img
                      src={collection.coverPhotoUrl}
                      alt={collection.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
                  )}
                  <div className="absolute top-3 right-3">
                    {collection.isPublic ? (
                      <Globe className="h-4 w-4 text-muted-foreground/60" />
                    ) : (
                      <Lock className="h-4 w-4 text-muted-foreground/60" />
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                    {collection.title}
                  </h3>
                  {collection.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {collection.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {collection.routeCount} {collection.routeCount === 1 ? "route" : "routes"}
                  </p>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
