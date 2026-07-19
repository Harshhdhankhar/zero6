"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MapPin,
  Route,
  Users,
  Calendar,
  Building2,
  X,
  Loader2,
} from "lucide-react";

interface SearchResult {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  type: string;
  subtitle: string;
}

interface SearchResults {
  places: SearchResult[];
  routes: SearchResult[];
  clubs: SearchResult[];
  events: SearchResult[];
  cities: SearchResult[];
}

interface SearchBarProps {
  onResultClick: (result: SearchResult) => void;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  places: MapPin,
  routes: Route,
  clubs: Users,
  events: Calendar,
  cities: Building2,
};

const TYPE_LABELS: Record<string, string> = {
  places: "Places",
  routes: "Routes",
  clubs: "Clubs",
  events: "Events",
  cities: "Cities",
};

export function SearchBar({ onResultClick }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults(null);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/maps/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
          setOpen(true);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasResults = results && Object.values(results).some((arr) => arr.length > 0);
  const totalResults = results
    ? Object.values(results).reduce((sum, arr) => sum + arr.length, 0)
    : 0;

  const handleSelect = useCallback(
    (result: SearchResult) => {
      setOpen(false);
      setQuery(result.name);
      onResultClick(result);
    },
    [onResultClick]
  );

  return (
    <div className="relative z-30">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (hasResults) setOpen(true);
          }}
          placeholder="Search places, routes, clubs, events..."
          className="input h-10 w-full pl-10 pr-10 text-sm"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
        {!loading && query && (
          <button
            onClick={() => {
              setQuery("");
              setResults(null);
              setOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && hasResults && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 w-full max-h-96 overflow-y-auto rounded-xl border border-border bg-card shadow-2xl backdrop-blur-xl"
          >
            <div className="p-2 text-xs text-muted-foreground px-3 py-2">
              {totalResults} result{totalResults !== 1 ? "s" : ""}
            </div>

            {(Object.entries(results || {}) as [string, SearchResult[]][]).map(([type, items]) => {
              if (items.length === 0) return null;
              const Icon = TYPE_ICONS[type] || MapPin;
              return (
                <div key={type}>
                  <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground">
                    <Icon className="h-3 w-3" />
                    {TYPE_LABELS[type] || type}
                  </div>
                  {items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-white/[0.04] cursor-pointer"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 border border-border shrink-0">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 text-left">
                        <p className="font-medium truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {item.subtitle}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
