import { api } from "./client";

// BE BookmarkItem (GET /api/bookmarks)
export interface BeBookmarkItem {
  eventId: string;
  issueType: string;   // "bill" | "petition" | "legislation"
  title: string;
  createdAt: string;
}

interface BookmarkResponse {
  bookmarked: boolean;
  eventId: string;
  message: string;
}

export async function getBookmarks(): Promise<BeBookmarkItem[]> {
  return api.get<BeBookmarkItem[]>("/api/bookmarks");
}

export async function addBookmark(eventId: string, issueType: string, title: string): Promise<boolean> {
  const res = await api.post<BookmarkResponse>("/api/bookmarks", { eventId, issueType, title });
  return res.bookmarked;
}

export async function removeBookmark(eventId: string): Promise<boolean> {
  const res = await api.delete<BookmarkResponse>(`/api/bookmarks/${eventId}`);
  return res.bookmarked;
}
