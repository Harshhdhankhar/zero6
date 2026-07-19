"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RouteCard, RouteCardSkeleton } from "./route-card";
import type { Route } from "@/types";

export interface RouteListProps {
  routes: Route[];
  loading?: boolean;
  total?: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onBookmark?: (routeId: string) => void;
}

export function RouteList({
  routes,
  loading,
  total = 0,
  page,
  limit,
  onPageChange,
  onBookmark,
}: RouteListProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <RouteCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (routes.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-3">🗺️</div>
        <p className="text-sm text-muted-foreground">No routes found</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Try adjusting your filters
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${page}-${routes.length}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {routes.map((route) => (
            <RouteCard
              key={route.id}
              route={route}
              onBookmark={onBookmark}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary/50 hover:bg-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
            const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
            if (pageNum > totalPages) return null;
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  pageNum === page
                    ? "bg-primary text-white"
                    : "bg-secondary/50 hover:bg-secondary"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary/50 hover:bg-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
