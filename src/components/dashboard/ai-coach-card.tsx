import Link from "next/link";
import { Bot, Sparkles, ArrowRight } from "lucide-react";

export function AICoachCard() {
  return (
    <Link href="/coach" className="block h-full group">
      <div className="rounded-2xl border border-border bg-card p-5 h-full flex flex-col transition-all duration-300 group-hover:border-primary/30 group-hover:shadow-lg group-hover:shadow-primary/5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold">AI Coach</h3>
              <Sparkles className="h-3 w-3 text-primary" />
            </div>
            <p className="text-[10px] text-muted-foreground">Powered by ZERO6 AI</p>
          </div>
        </div>

        <div className="mt-3 flex-1 space-y-2.5">
          <div className="rounded-xl px-3 py-2 text-xs leading-relaxed bg-secondary/50 text-foreground">
            <p className="line-clamp-3">
              Hi! I&apos;m your AI running coach. Ask me anything about training, technique, or running goals!
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-secondary/30 px-3 py-2 transition-colors group-hover:bg-primary/5 group-hover:border-primary/20">
          <span className="flex-1 text-xs text-muted-foreground">Ask your AI coach...</span>
          <ArrowRight className="h-3.5 w-3.5 text-primary transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}
