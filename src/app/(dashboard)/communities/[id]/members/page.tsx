"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { User } from "@/types";

export default function ClubMembersPage() {
  const params = useParams();
  const { data: members, loading } = useFetch<User[]>(`/api/clubs/${params.id}/members`);

  return (
    <div className="space-y-6">
      <Link
        href={`/communities/${params.id}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to club
      </Link>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Members
        </h2>
        <div className="mt-4 space-y-2">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg p-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))
          ) : !members || members.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No members found</p>
          ) : (
            members.map((user) => (
              <Link
                key={user.id}
                href={`/profile/${user.username}`}
                className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-secondary/50"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground">Lv {user.level}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
