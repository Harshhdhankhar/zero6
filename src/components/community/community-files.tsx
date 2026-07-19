"use client";

import { useFetch } from "@/hooks/use-fetch";
import {
  FileText, Download, Calendar, User, File,
  Loader2, AlertCircle, RefreshCw, BookOpen,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface CommunityFile {
  id: string; title: string; description: string; fileUrl: string;
  fileType: string; fileSize: number; category: string;
  downloadsCount: number; createdAt: string;
  uploadedBy: { id: string; name: string; avatar: string } | null;
}

const FILE_ICONS: Record<string, any> = {
  pdf: FileText,
  doc: FileText,
  xls: File,
  image: File,
  map: BookOpen,
};

const CATEGORY_COLORS: Record<string, string> = {
  training: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  nutrition: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  waivers: "text-red-400 bg-red-500/10 border-red-500/20",
  maps: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  other: "text-white/40 bg-secondary/30 border-border",
};

export function CommunityFiles({ clubId }: { clubId: string }) {
  const { data, loading, error, refetch } = useFetch<{ data: CommunityFile[]; meta: any }>(`/api/clubs/${clubId}/community?resource=files`);
  const files = data?.data || [];

  if (loading) return <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>;

  if (error) return (
    <div className="flex flex-col items-center py-12 text-center">
      <AlertCircle className="h-8 w-8 text-red-400 mb-2" />
      <p className="text-sm text-white/60">Failed to load files</p>
      <Button variant="secondary" size="sm" onClick={refetch} className="mt-3 gap-2"><RefreshCw className="h-3 w-3" /> Retry</Button>
    </div>
  );

  if (files.length === 0) return (
    <div className="flex flex-col items-center py-12 text-center">
      <FileText className="h-10 w-10 text-white/20 mb-2" />
      <p className="text-sm text-white/40">No files uploaded yet</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {files.map((file, i) => {
        const Icon = FILE_ICONS[file.fileType] || FileText;
        return (
          <motion.div key={file.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-border bg-white/[0.03] p-4 hover:border-border transition-all group">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-primary/20 to-orange-500/20 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-white">{file.title}</h3>
                    {file.description && <p className="text-[11px] text-white/50 mt-0.5 line-clamp-1">{file.description}</p>}
                  </div>
                  <Badge className={cn("text-[9px] px-1.5 py-0 rounded capitalize shrink-0", CATEGORY_COLORS[file.category] || CATEGORY_COLORS.other)}>
                    {file.category}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-2 text-[10px] text-white/40">
                  <span className="flex items-center gap-1"><User className="h-3 w-3" /> {file.uploadedBy?.name || "Admin"}</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(file.createdAt).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><Download className="h-3 w-3" /> {file.downloadsCount || 0}</span>
                </div>
                <a href={file.fileUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-2 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors">
                  <Download className="h-3 w-3" /> Download
                </a>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
