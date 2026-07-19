"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value: File | null;
  onChange: (file: File | null) => void;
  aspectRatio: { w: number; h: number };
  maxSizeMB: number;
  shape: "circle" | "rectangle";
  label: string;
  placeholder: string;
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  aspectRatio,
  maxSizeMB,
  shape,
  label,
  placeholder,
  className,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string>("");
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value) {
      const url = URL.createObjectURL(value);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview("");
  }, [value]);

  const validateFile = useCallback((file: File): boolean => {
    setError("");
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError("Unsupported format. Use JPG, PNG, or WEBP.");
      return false;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File too large (max ${maxSizeMB}MB).`);
      return false;
    }
    return true;
  }, [maxSizeMB]);

  const handleFile = useCallback((file: File) => {
    if (!validateFile(file)) return;
    onChange(file);
  }, [validateFile, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (inputRef.current) inputRef.current.value = "";
  }, [handleFile]);

  const handleRemove = useCallback(() => {
    onChange(null);
    setError("");
  }, [onChange]);

  const isBanner = aspectRatio.w > aspectRatio.h;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-white">{label}</label>
        <span className="text-[10px] text-white/40">{maxSizeMB}MB max</span>
      </div>

      <AnimatePresence mode="wait">
        {preview ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            className={cn(
              "relative group overflow-hidden bg-secondary/30",
              shape === "circle" ? "w-28 h-28 rounded-full mx-auto" : "w-full rounded-xl aspect-video",
            )}
          >
            <img
              src={preview}
              alt={label}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all cursor-pointer"
                title="Change image"
              >
                <Camera className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="p-2 rounded-full bg-red-500/70 hover:bg-red-500 text-white transition-all cursor-pointer"
                title="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="upload"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
          >
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={cn(
                "relative w-full border-2 border-dashed rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center gap-2 text-white/40 hover:text-white/60 hover:border-white/30 group",
                dragOver && "!border-primary bg-primary/5 !text-primary",
                shape === "circle" ? "w-28 h-28 rounded-full mx-auto" : "w-full rounded-xl aspect-video",
                error ? "!border-red-500/50" : "border-border",
              )}
            >
              {isBanner ? (
                <div className="flex flex-col items-center gap-2">
                  <ImageIcon className="h-8 w-8 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-medium">{placeholder}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5">
                  <div className="p-2.5 rounded-full bg-secondary/30 group-hover:bg-secondary transition-colors">
                    <Camera className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-medium">{placeholder}</span>
                </div>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[11px] text-red-400 text-center"
        >
          {error}
        </motion.p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleInput}
        className="hidden"
      />
    </div>
  );
}
