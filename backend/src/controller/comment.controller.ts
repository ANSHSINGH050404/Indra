import { Request, Response } from "express";
import { db } from "../db/index";
import { commentsTable, usersTable, marketsTable } from "../db/schema";
import { eq, desc, or } from "drizzle-orm";

export const getMarketComments = async (req: Request, res: Response) => {
  const identifier = req.params.marketId as string; // could be UUID or slug

  try {
    let marketId = identifier;

    // Check if it's a slug (contains non-hex/non-dash or doesn't match UUID format)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

    if (!isUuid) {
      const market = await db.query.marketsTable.findFirst({
        where: eq(marketsTable.slug, identifier),
      });
      if (!market) return res.status(404).json({ message: "Market not found" });
      marketId = market.id;
    }

    const comments = await db.query.commentsTable.findMany({
      where: eq(commentsTable.marketId, marketId),
      orderBy: [desc(commentsTable.createdAt)],
      with: {
        user: {
          columns: {
            id: true,
            fullname: true,
          },
        },
      },
    });

    res.status(200).json(comments);
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const postComment = async (req: any, res: Response) => {
  const { marketId, content } = req.body;
  const userId = req.user.id;

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ message: "Comment content is required" });
  }

  try {
    const [newComment] = await db.insert(commentsTable).values({
      marketId,
      userId,
      content,
    }).returning();

    // Fetch comment with user info
    const commentWithUser = await db.query.commentsTable.findFirst({
      where: eq(commentsTable.id, newComment.id),
      with: {
        user: {
          columns: {
            id: true,
            fullname: true,
          },
        },
      },
    });

    res.status(201).json(commentWithUser);
  } catch (error) {
    console.error("Post comment error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
