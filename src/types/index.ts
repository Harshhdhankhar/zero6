/* ================================================================
   ZERO6 — TypeScript Type Definitions
   Comprehensive types for the entire running community platform
   ================================================================ */

// ----------------------------------------------------------------
// User & Auth
// ----------------------------------------------------------------

export type UserRole = "admin" | "club_owner" | "runner" | "guest";

export interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  location: string;
  role: UserRole;
  totalDistance: number; // meters
  totalRuns: number;
  totalDuration: number; // seconds
  currentStreak: number; // days
  longestStreak: number; // days
  level: number;
  xp: number;
  xpToNextLevel: number;
  followers: number;
  following: number;
  joinedAt: string; // ISO date
  isFollowing?: boolean;
  isCurrentUser?: boolean;
}

// ----------------------------------------------------------------
// Activities
// ----------------------------------------------------------------

export type ActivityType = "run" | "walk" | "trail" | "treadmill";

export interface RoutePoint {
  lat: number;
  lng: number;
  elevation?: number;
}

export interface Split {
  km: number;
  time: number; // seconds
  pace: number; // seconds per km
  elevation: number; // meters
}

export interface Activity {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  type: ActivityType;
  title: string;
  description: string;
  distance: number; // meters
  duration: number; // seconds
  pace: number; // seconds per km
  calories: number;
  elevationGain: number; // meters
  heartRateAvg: number; // bpm
  heartRateMax: number; // bpm
  cadenceAvg: number; // steps per minute
  route: RoutePoint[];
  splits: Split[];
  date: string; // ISO date
  likes: number;
  comments: number;
  isLiked: boolean;
  mapImageUrl?: string;
}

// ----------------------------------------------------------------
// Clubs
// ----------------------------------------------------------------

export type ClubCategory =
  | "road"
  | "trail"
  | "track"
  | "casual"
  | "competitive"
  | "social";

export interface Club {
  id: string;
  name: string;
  description: string;
  avatar: string;
  coverImage: string;
  location: string;
  memberCount: number;
  activityCount: number;
  isJoined: boolean;
  createdBy: string;
  category: ClubCategory;
  tags: string[];
  createdAt: string; // ISO date
}

// ----------------------------------------------------------------
// Events
// ----------------------------------------------------------------

export type EventType =
  | "5k"
  | "10k"
  | "half_marathon"
  | "marathon"
  | "ultra"
  | "trail_race"
  | "fun_run"
  | "virtual";

export type EventStatus = "upcoming" | "ongoing" | "completed" | "cancelled";

export interface Event {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  date: string; // ISO date
  time: string;
  location: string;
  distance: number; // meters
  type: EventType;
  registeredCount: number;
  maxParticipants: number;
  price: number;
  currency: string;
  isRegistered: boolean;
  organizer: string;
  organizerAvatar: string;
  organizerId: string;
  tags: string[];
  status: EventStatus;
  registeredAt?: string;
}

// ----------------------------------------------------------------
// Challenges
// ----------------------------------------------------------------

export type ChallengeType =
  | "distance"
  | "duration"
  | "frequency"
  | "streak"
  | "elevation"
  | "pace";

export type ChallengeDifficulty = "beginner" | "intermediate" | "advanced" | "elite";

export interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: ChallengeType;
  target: number;
  current: number;
  unit: string;
  startDate: string; // ISO date
  endDate: string; // ISO date
  participantCount: number;
  isJoined: boolean;
  reward: string;
  rewardXP: number;
  difficulty: ChallengeDifficulty;
}

// ----------------------------------------------------------------
// Achievements
// ----------------------------------------------------------------

export type AchievementCategory =
  | "distance"
  | "speed"
  | "consistency"
  | "social"
  | "events"
  | "special";

export type AchievementRarity =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  isUnlocked: boolean;
  unlockedAt?: string; // ISO date
  progress: number;
  target: number;
  xpReward: number;
  rarity: AchievementRarity;
}

// ----------------------------------------------------------------
// Notifications
// ----------------------------------------------------------------

export type NotificationType =
  | "like"
  | "comment"
  | "follow"
  | "achievement"
  | "challenge"
  | "event"
  | "club"
  | "system";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  avatar?: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: string; // ISO date
}

// ----------------------------------------------------------------
// Messaging
// ----------------------------------------------------------------

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string; // ISO date
  isRead: boolean;
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar: string;
  lastMessage: string;
  lastMessageTime: string; // ISO date
  unreadCount: number;
  isOnline: boolean;
}

// ----------------------------------------------------------------
// Weather
// ----------------------------------------------------------------

export type WeatherCondition =
  | "sunny"
  | "partly_cloudy"
  | "cloudy"
  | "rain"
  | "thunderstorm"
  | "snow"
  | "fog";

export interface WeatherData {
  temp: number; // Celsius
  feelsLike: number; // Celsius
  humidity: number; // percentage
  windSpeed: number; // km/h
  condition: WeatherCondition;
  description: string;
  aqi: number;
  aqiLabel: string;
}

// ----------------------------------------------------------------
// Leaderboard
// ----------------------------------------------------------------

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar: string;
  value: number;
  unit: string;
  change: number; // position change (positive = up)
  isCurrentUser?: boolean;
}

// ----------------------------------------------------------------
// Rewards
// ----------------------------------------------------------------

export type RewardCategory =
  | "gear"
  | "experience"
  | "digital"
  | "donation"
  | "merch";

export interface Reward {
  id: string;
  title: string;
  description: string;
  icon: string;
  cost: number; // XP cost
  category: RewardCategory;
  isRedeemed: boolean;
  redeemedAt?: string; // ISO date
}

// ----------------------------------------------------------------
// AI Coach
// ----------------------------------------------------------------

export type AICoachRole = "user" | "assistant";

export interface AICoachMessage {
  id: string;
  role: AICoachRole;
  content: string;
  timestamp: string; // ISO date
}

// ----------------------------------------------------------------
// API Response Types
// ----------------------------------------------------------------

export interface ActiveChallenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: ChallengeType;
  goalValue: number;
  goalUnit: string;
  progress: number;
  status: "active" | "completed";
  endDate: string;
}

export interface RecentAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
}

// ----------------------------------------------------------------
// Stats & Analytics
// ----------------------------------------------------------------

export interface WeeklyDataPoint {
  day: string;
  distance: number; // meters
  duration: number; // seconds
  runs: number;
}

export interface MonthlyDataPoint {
  week: string;
  distance: number; // meters
  duration: number; // seconds
  runs: number;
}

export interface RunningStats {
  weeklyDistance: number; // meters
  weeklyRuns: number;
  weeklyDuration: number; // seconds
  monthlyDistance: number; // meters
  avgPace: number; // seconds per km
  bestPace: number; // seconds per km
  weeklyData: WeeklyDataPoint[];
  monthlyData: MonthlyDataPoint[];
}

// ----------------------------------------------------------------
// Heatmap
// ----------------------------------------------------------------

export interface HeatmapTileData {
  tileX: number;
  tileY: number;
  intensity: number;
  runCount: number;
  runnerCount: number;
}

export interface HeatmapWaypoint {
  id: string;
  latitude: number;
  longitude: number;
  altitude: number | null;
  speed: number | null;
  recordedAt: string;
}

export interface PersonalHeatmapSummary {
  totalUniqueLocations: number;
  mostVisitedLocation: string | null;
  longestRouteId: string | null;
  favoriteRouteId: string | null;
  totalDistanceCovered: number;
}

export interface PersonalHeatmapResponse {
  waypoints: HeatmapWaypoint[];
  summary: PersonalHeatmapSummary;
  meta: { total: number; page: number; limit: number };
}

// ----------------------------------------------------------------
// Routes
// ----------------------------------------------------------------

export type Difficulty = "easy" | "moderate" | "hard" | "extreme";
export type SurfaceType = "road" | "trail" | "track" | "park" | "mixed" | "treadmill";
export type RouteType = "loop" | "out-and-back" | "point-to-point";

export interface Route {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  distance: number;
  durationEstimate: number;
  elevationGain: number;
  elevationLoss: number;
  paceEstimate: number;
  difficulty: Difficulty;
  surfaceType: SurfaceType;
  routeType: RouteType;
  geometry: RoutePoint[];
  city: string | null;
  state: string | null;
  country: string;
  tags: string[];
  isPublic: boolean;
  isFeatured: boolean;
  status: "draft" | "published" | "archived";
  createdAt: string;
  updatedAt: string;
  creator?: { id: string; name: string; username: string; avatar: string };
  statistics?: RouteStatistics;
  isBookmarked?: boolean;
  isLiked?: boolean;
  photos?: RoutePhoto[];
  reviews?: RouteReview[];
  reviewCount?: number;
}

export interface RouteStatistics {
  id: string;
  routeId: string;
  totalRuns: number;
  uniqueRunners: number;
  averagePace: number;
  fastestTime: number;
  longestDistance: number;
  averageRating: number;
  reviewCount: number;
  communityScore: number;
  photoCount: number;
  bookmarkCount: number;
  likeCount: number;
}

export interface RoutePhoto {
  id: string;
  routeId: string;
  userId: string;
  url: string;
  thumbnailUrl: string | null;
  caption: string | null;
  latitude: number | null;
  longitude: number | null;
  isCover: boolean;
  createdAt: string;
}

export interface RouteReview {
  id: string;
  routeId: string;
  userId: string;
  rating: number;
  difficultyRating: number | null;
  safetyRating: number | null;
  cleanlinessRating: number | null;
  crowdRating: number | null;
  lightingRating: number | null;
  waterAvailability: number | null;
  comment: string | null;
  wouldRecommend: boolean;
  createdAt: string;
  user?: { id: string; name: string; username: string; avatar: string };
}

export interface RouteCollection {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  coverPhotoUrl: string | null;
  isPublic: boolean;
  type: "favorites" | "weekend" | "training" | "hill" | "distance" | "time_of_day" | "custom";
  distanceCategory: "5k" | "10k" | "half_marathon" | "marathon" | "ultra" | "any";
  createdAt: string;
  routeCount?: number;
  items?: RouteCollectionItem[];
}

export interface RouteCollectionItem {
  id: string;
  collectionId: string;
  routeId: string;
  notes: string | null;
  sortOrder: number;
  route?: Route;
}
