async function apiRequest<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}

export const actions = {
  joinClub: (clubId: string) =>
    apiRequest("/api/clubs/join", {
      method: "POST",
      body: JSON.stringify({ clubId }),
    }),

  leaveClub: (clubId: string) =>
    apiRequest("/api/clubs/join", {
      method: "DELETE",
      body: JSON.stringify({ clubId }),
    }),

  followUser: (userId: string) =>
    apiRequest("/api/users/follow", {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),

  unfollowUser: (userId: string) =>
    apiRequest("/api/users/follow", {
      method: "DELETE",
      body: JSON.stringify({ userId }),
    }),

  registerEvent: (eventId: string) =>
    apiRequest("/api/events/register", {
      method: "POST",
      body: JSON.stringify({ eventId }),
    }),

  unregisterEvent: (eventId: string) =>
    apiRequest("/api/events/register", {
      method: "DELETE",
      body: JSON.stringify({ eventId }),
    }),

  joinChallenge: (challengeId: string) =>
    apiRequest("/api/challenges/join", {
      method: "POST",
      body: JSON.stringify({ challengeId }),
    }),

  likeActivity: (activityId: string) =>
    apiRequest(`/api/activities/${activityId}/like`, { method: "POST" }),

  unlikeActivity: (activityId: string) =>
    apiRequest(`/api/activities/${activityId}/like`, { method: "DELETE" }),

  commentActivity: (activityId: string, content: string) =>
    apiRequest(`/api/activities/${activityId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),

  createActivity: (data: Record<string, unknown>) =>
    apiRequest("/api/activities", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  createClub: (data: Record<string, unknown>) =>
    apiRequest("/api/clubs", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  createEvent: (data: Record<string, unknown>) =>
    apiRequest("/api/events", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateEvent: (id: string, data: Record<string, unknown>) =>
    apiRequest(`/api/events/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  updateProfile: (data: Record<string, unknown>) =>
    apiRequest("/api/users", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  sendMessage: (receiverId: string, content: string) =>
    apiRequest("/api/messages", {
      method: "POST",
      body: JSON.stringify({ receiverId, content }),
    }),

  markNotificationRead: (id: string) =>
    apiRequest("/api/notifications", {
      method: "PUT",
      body: JSON.stringify({ id }),
    }),

  markAllNotificationsRead: () =>
    apiRequest("/api/notifications", {
      method: "PUT",
      body: JSON.stringify({ markAll: true }),
    }),

  // Community Chat Channels
  getChannels: (clubId: string) =>
    apiRequest<{ data: any[] }>(`/api/clubs/${clubId}/channels`),

  createChannel: (clubId: string, data: Record<string, unknown>) =>
    apiRequest(`/api/clubs/${clubId}/channels`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateChannel: (clubId: string, data: Record<string, unknown>) =>
    apiRequest(`/api/clubs/${clubId}/channels`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteChannel: (clubId: string, channelId: string) =>
    apiRequest(`/api/clubs/${clubId}/channels?channelId=${channelId}`, {
      method: "DELETE",
    }),

  // Community Albums
  getAlbums: (clubId: string) =>
    apiRequest<{ data: any[] }>(`/api/clubs/${clubId}/albums`),

  createAlbum: (clubId: string, data: Record<string, unknown>) =>
    apiRequest(`/api/clubs/${clubId}/albums`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateAlbum: (clubId: string, data: Record<string, unknown>) =>
    apiRequest(`/api/clubs/${clubId}/albums`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteAlbum: (clubId: string, albumId: string) =>
    apiRequest(`/api/clubs/${clubId}/albums?albumId=${albumId}`, {
      method: "DELETE",
    }),

  getAlbumPhotos: (clubId: string, albumId: string) =>
    apiRequest<{ data: any[] }>(`/api/clubs/${clubId}/albums/photos?albumId=${albumId}`),

  addAlbumPhoto: (clubId: string, data: Record<string, unknown>) =>
    apiRequest(`/api/clubs/${clubId}/albums/photos`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  deleteAlbumPhoto: (clubId: string, photoId: string) =>
    apiRequest(`/api/clubs/${clubId}/albums/photos?photoId=${photoId}`, {
      method: "DELETE",
    }),

  // Community Routes
  getCommunityRoutes: (clubId: string) =>
    apiRequest<{ data: any[] }>(`/api/clubs/${clubId}/routes`),

  createCommunityRoute: (clubId: string, data: Record<string, unknown>) =>
    apiRequest(`/api/clubs/${clubId}/routes`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateCommunityRoute: (clubId: string, data: Record<string, unknown>) =>
    apiRequest(`/api/clubs/${clubId}/routes`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteCommunityRoute: (clubId: string, routeId: string) =>
    apiRequest(`/api/clubs/${clubId}/routes?routeId=${routeId}`, {
      method: "DELETE",
    }),

  // Community Runs
  getCommunityRuns: (clubId: string, status?: string) =>
    apiRequest<{ data: any[] }>(`/api/clubs/${clubId}/runs${status ? `?status=${status}` : ""}`),

  createCommunityRun: (clubId: string, data: Record<string, unknown>) =>
    apiRequest(`/api/clubs/${clubId}/runs`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateCommunityRun: (clubId: string, data: Record<string, unknown>) =>
    apiRequest(`/api/clubs/${clubId}/runs`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  registerCommunityRun: (clubId: string, runId: string) =>
    apiRequest(`/api/clubs/${clubId}/runs/register`, {
      method: "POST",
      body: JSON.stringify({ runId }),
    }),

  unregisterCommunityRun: (clubId: string, runId: string) =>
    apiRequest(`/api/clubs/${clubId}/runs/register`, {
      method: "DELETE",
      body: JSON.stringify({ runId }),
    }),

  // Community Settings
  getCommunitySettings: (clubId: string) =>
    apiRequest<{ data: any }>(`/api/clubs/${clubId}/settings`),

  updateCommunitySettings: (clubId: string, data: Record<string, unknown>) =>
    apiRequest(`/api/clubs/${clubId}/settings`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Community Stats
  getCommunityStats: (clubId: string) =>
    apiRequest<{ data: any }>(`/api/clubs/${clubId}/stats`),

  // Community Notifications
  getCommunityNotifications: (clubId: string) =>
    apiRequest<{ data: any[] }>(`/api/clubs/${clubId}/notifications`),
};
