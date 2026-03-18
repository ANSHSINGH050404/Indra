import { db } from "../db/index";
import { usersTable } from "../db/schema";
import { ilike, sql } from "drizzle-orm";

export type LeaderboardQuery = {
  q?: string;
  limit?: number;
};

export type LeaderboardEntry = {
  id: number;
  fullname: string;
  points: number;
};

export const getLeaderboardData = async (query: LeaderboardQuery = {}) => {
  const q = query.q?.trim();
  const limitRaw = query.limit ?? 50;
  const limit = Math.min(Math.max(limitRaw, 1), 200);

  if (q) {
    const rows = await db
      .select({
        id: usersTable.id,
        fullname: usersTable.fullname,
        points: usersTable.points,
      })
      .from(usersTable)
      .where(ilike(usersTable.fullname, `%${q}%`))
      .orderBy(sql`${usersTable.points} DESC`, sql`${usersTable.id} ASC`)
      .limit(limit);

    return rows as LeaderboardEntry[];
  }

  const rows = await db
    .select({
      id: usersTable.id,
      fullname: usersTable.fullname,
      points: usersTable.points,
    })
    .from(usersTable)
    .orderBy(sql`${usersTable.points} DESC`, sql`${usersTable.id} ASC`)
    .limit(limit);

  return rows as LeaderboardEntry[];
};
