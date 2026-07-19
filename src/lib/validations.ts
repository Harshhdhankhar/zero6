import { z } from "zod";
import { NextResponse } from "next/server";

// Auth Schemas
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

// Activity Schemas
export const activitySchema = z.object({
  type: z.enum(["run", "walk", "trail", "treadmill"]),
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).optional(),
  distance: z.number().positive("Distance must be positive"),
  duration: z.number().positive("Duration must be positive"),
  date: z.string().datetime(),
});

// Event Schemas
export const createEventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  location: z.string().min(3, "Location is required"),
  distance: z.number().positive(),
  type: z.enum(["5k", "10k", "half_marathon", "marathon", "ultra", "trail_race", "fun_run", "virtual"]),
  maxParticipants: z.number().int().positive().optional(),
  price: z.number().min(0).optional(),
});

export const updateEventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100).optional(),
  description: z.string().min(10).max(1000).optional(),
  status: z.enum(["upcoming", "ongoing", "completed", "cancelled"]).optional(),
  maxParticipants: z.number().int().positive().optional(),
});

// Club Schemas
export const createClubSchema = z.object({
  name: z.string().min(2, "Club name must be at least 2 characters").max(50),
  description: z.string().min(10, "Description must be at least 10 characters").max(500),
  location: z.string().min(2, "Location is required"),
  category: z.enum(["road", "trail", "track", "social", "competitive", "casual"]),
});

// Profile Schemas
export const updateProfileSchema = z.object({
  name: z.string().min(2).max(50),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores"),
  bio: z.string().max(200).optional(),
  location: z.string().max(100).optional(),
});

// Action payload schemas (for API body validation)
export const idOnlySchema = z.object({
  clubId: z.string().uuid("Invalid club ID"),
  eventId: z.string().uuid("Invalid event ID"),
  challengeId: z.string().uuid("Invalid challenge ID"),
  userId: z.string().uuid("Invalid user ID"),
  rewardId: z.string().uuid("Invalid reward ID"),
});

export const joinClubSchema = z.object({
  clubId: z.string().uuid("Invalid club ID"),
});

export const registerEventSchema = z.object({
  eventId: z.string().uuid("Invalid event ID"),
});

export const joinChallengeSchema = z.object({
  challengeId: z.string().uuid("Invalid challenge ID"),
});

export const followUserSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
});

export const sendMessageSchema = z.object({
  receiverId: z.string().uuid("Invalid receiver ID"),
  content: z.string().min(1, "Message cannot be empty").max(2000),
});

export const redeemRewardSchema = z.object({
  rewardId: z.string().uuid("Invalid reward ID"),
  cost: z.number().int().positive("Cost must be a positive integer"),
});

export const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(1000),
});

export const markNotificationReadSchema = z.object({
  id: z.string().uuid("Invalid notification ID"),
});

export const markAllNotificationsReadSchema = z.object({
  markAll: z.literal(true),
});

// Helper: validate request body against a Zod schema
export function validateBody<T extends z.ZodType>(
  schema: T,
  body: unknown
): { success: true; data: z.infer<T> } | { success: false; response: NextResponse } {
  const result = schema.safeParse(body);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({
      field: i.path.join("."),
      message: i.message,
    }));
    return {
      success: false,
      response: NextResponse.json({ error: "Validation failed", details }, { status: 400 }),
    };
  }
  return { success: true, data: result.data };
}

// Export types
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ActivityFormData = z.infer<typeof activitySchema>;
export type CreateEventFormData = z.infer<typeof createEventSchema>;
export type CreateClubFormData = z.infer<typeof createClubSchema>;
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
