"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { puter } from "@heyputer/puter.js";
import { Check, Circle, Plus, RefreshCw, Trash2, ListTodo, LogOut } from "lucide-react";
import Link from "next/link";

interface Todo {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
}

const STORAGE_KEY = "zero6-todos";

export default function TodoPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    puter.auth.getUser().then(setUser).catch(() => setUser(null));
  }, []);

  const loadTodos = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await puter.kv.get(STORAGE_KEY);
      if (raw) {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        setTodos(Array.isArray(parsed) ? parsed : []);
      }
    } catch {
      setTodos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveTodos = useCallback(async (updated: Todo[]) => {
    setSaving(true);
    try {
      await puter.kv.set(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save:", e);
    } finally {
      setSaving(false);
    }
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const addTodo = useCallback(async () => {
    const text = input.trim();
    if (!text) return;
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text,
      done: false,
      createdAt: new Date().toISOString(),
    };
    const updated = [newTodo, ...todos];
    setTodos(updated);
    setInput("");
    inputRef.current?.focus();
    await saveTodos(updated);
  }, [input, todos, saveTodos]);

  const toggleTodo = useCallback(
    async (id: string) => {
      const updated = todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
      setTodos(updated);
      await saveTodos(updated);
    },
    [todos, saveTodos],
  );

  const deleteTodo = useCallback(
    async (id: string) => {
      const updated = todos.filter((t) => t.id !== id);
      setTodos(updated);
      await saveTodos(updated);
    },
    [todos, saveTodos],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") addTodo();
  };

  const doneCount = todos.filter((t) => t.done).length;

  return (
    <div className="min-h-screen bg-background text-white selection:bg-primary/30">
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 glass">
        <Link href="/" className="flex items-center gap-2">
          <ListTodo className="w-5 h-5 text-primary" />
          <span className="font-bold text-sm tracking-tight">
            ZERO<span className="text-primary">6</span> <span className="text-muted-foreground font-normal">Todo</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground hidden sm:block">
            {saving ? "saving..." : "synced to cloud"}
          </span>
          {user && (
            <button
              onClick={async () => { await puter.auth.signOut(); setUser(null); }}
              className="btn-glass px-3 py-1.5 text-xs flex items-center gap-1.5"
            >
              <LogOut className="w-3 h-3" />
              Sign Out
            </button>
          )}
        </div>
      </nav>

      <main className="pt-24 pb-16 px-4 max-w-lg mx-auto">
        <div className="text-center mb-10">
          <h1 className="display-heading text-4xl sm:text-5xl font-black mb-2">
            Todo
          </h1>
          <p className="text-sm text-muted-foreground">
            {todos.length > 0
              ? `${doneCount} of ${todos.length} done`
              : "Add your first task"}
          </p>
        </div>

        <div className="flex gap-2 mb-8">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What needs to be done?"
            className="input flex-1 px-4 py-3 text-sm"
          />
          <button
            onClick={addTodo}
            disabled={!input.trim()}
            className="btn-primary px-4 py-3 disabled:opacity-40 disabled:pointer-events-none"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : todos.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <ListTodo className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No tasks yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Type something above and press Enter</p>
          </div>
        ) : (
          <ul className="space-y-1.5">
            {todos.map((todo) => (
              <li
                key={todo.id}
                className="card-interactive group flex items-center gap-3 px-4 py-3.5 rounded-xl bg-card border border-border transition-all"
              >
                <button onClick={() => toggleTodo(todo.id)} className="shrink-0">
                  {todo.done ? (
                    <Check className="w-4 h-4 text-primary" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors" />
                  )}
                </button>
                <span
                  className={`flex-1 text-sm transition-all ${
                    todo.done ? "line-through text-muted-foreground/50" : "text-white"
                  }`}
                >
                  {todo.text}
                </span>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5 text-muted-foreground/40 hover:text-error transition-colors" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {todos.length > 0 && (
          <div className="flex justify-center mt-8">
            <button
              onClick={loadTodos}
              className="btn-glass px-4 py-2 text-xs flex items-center gap-1.5"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh from cloud
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
