export interface UserContext {
  profile: {
    id: string;
    name: string;
    username: string;
    level: number;
    xp: number;
    xpToNextLevel: number;
    streak: number;
    totalDistance: number;
    totalRuns: number;
    totalDuration: number;
  };
  dashboard: {
    todayDistance: number;
    todayDuration: number;
    todayRuns: number;
    weeklyDistance: number;
    weeklyDuration: number;
    weeklyRuns: number;
    monthlyDistance: number;
    monthlyRuns: number;
    avgPace: number;
    goals: {
      id: string;
      type: string;
      target: number;
      current: number;
      unit: string;
      period: string;
      title: string;
    }[];
  };
  activities: {
    recent: {
      id: string;
      title: string;
      distance: number;
      duration: number;
      pace: number;
      date: string;
      type: string;
    }[];
    personalRecords: { label: string; value: string }[];
  };
  communities: { id: string; name: string; role: string; memberCount: number }[];
  events: {
    upcoming: { id: string; title: string; date: string; location: string; type: string; distance: number }[];
    registered: number;
  };
  challenges: {
    active: { id: string; title: string; type: string; progress: number; target: number; unit: string; deadline: string }[];
    completed: number;
  };
  rewards: { xp: number; level: number; coins: number; badges: number };
  notifications: { unread: number; recent: { title: string; message: string }[] };
  weather: { temp: number; condition: string; aqi: number } | null;
  memory: {
    conversationsCount: number;
    recentTopics: string[];
    preferences: Record<string, string>;
  };
  savedItems: { routes: number; events: number };
}

export interface ActionResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface SSEMessage {
  type: "context" | "token" | "action" | "action-result" | "done" | "error" | "status";
  data: unknown;
}

export interface ConversationSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  preview?: string;
  group?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}
