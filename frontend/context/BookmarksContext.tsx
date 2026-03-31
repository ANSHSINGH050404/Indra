"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Bookmark = {
  id: string;
  slug: string;
  title: string;
  savedAt: number;
};

type BookmarkInput = Pick<Bookmark, "id" | "slug" | "title">;

type BookmarksContextType = {
  bookmarks: Bookmark[];
  bookmarkIds: ReadonlySet<string>;
  toggleBookmark: (market: BookmarkInput) => void;
  removeBookmark: (id: string) => void;
  clearBookmarks: () => void;
  isLoaded: boolean;
};

const BookmarksContext = createContext<BookmarksContextType | undefined>(
  undefined,
);

const STORAGE_KEY = "indra.bookmarks.v1";

const parseBookmarks = (raw: string | null): Bookmark[] => {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const out: Bookmark[] = [];
    const seen = new Set<string>();

    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const obj = item as Partial<Bookmark>;

      if (
        typeof obj.id !== "string" ||
        typeof obj.slug !== "string" ||
        typeof obj.title !== "string"
      ) {
        continue;
      }

      if (seen.has(obj.id)) continue;
      seen.add(obj.id);

      out.push({
        id: obj.id,
        slug: obj.slug,
        title: obj.title,
        savedAt:
          typeof obj.savedAt === "number" && Number.isFinite(obj.savedAt)
            ? obj.savedAt
            : Date.now(),
      });
    }

    out.sort((a, b) => b.savedAt - a.savedAt);
    return out;
  } catch {
    return [];
  }
};

const writeBookmarks = (bookmarks: Bookmark[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
};

export const BookmarksProvider = ({ children }: { children: ReactNode }) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setBookmarks(parseBookmarks(localStorage.getItem(STORAGE_KEY)));
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    writeBookmarks(bookmarks);
  }, [bookmarks, isLoaded]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      setBookmarks(parseBookmarks(e.newValue));
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const bookmarkIds = useMemo(
    () => new Set(bookmarks.map((b) => b.id)),
    [bookmarks],
  );

  const toggleBookmark = useCallback((market: BookmarkInput) => {
    setBookmarks((prev) => {
      const exists = prev.some((b) => b.id === market.id);
      if (exists) return prev.filter((b) => b.id !== market.id);

      const next: Bookmark[] = [
        { ...market, savedAt: Date.now() },
        ...prev,
      ];

      // Keep newest-first.
      next.sort((a, b) => b.savedAt - a.savedAt);
      return next;
    });
  }, []);

  const removeBookmark = useCallback((id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const clearBookmarks = useCallback(() => {
    setBookmarks([]);
  }, []);

  return (
    <BookmarksContext.Provider
      value={{
        bookmarks,
        bookmarkIds,
        toggleBookmark,
        removeBookmark,
        clearBookmarks,
        isLoaded,
      }}
    >
      {children}
    </BookmarksContext.Provider>
  );
};

export const useBookmarks = () => {
  const ctx = useContext(BookmarksContext);
  if (!ctx) {
    throw new Error("useBookmarks must be used within a BookmarksProvider");
  }
  return ctx;
};

