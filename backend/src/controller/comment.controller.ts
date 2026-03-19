import { Request, Response } from "express";
import { db } from "../db/index";
import { commentsTable, usersTable } from "../db/schema";
import { eq, desc } from "drizzle-orm";

export const getMarketComments = async (req: Request, res: Response) => {
  const marketId = req.params.marketId as string;

  try {
    const comments = await db.query.commentsTable.findMany({
      where: eq(commentsTable.marketId, marketId),
      orderBy: [desc(commentsTable.createdAt)],
      with: {
        user: {
          columns: {
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
