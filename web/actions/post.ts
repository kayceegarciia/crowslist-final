"use server";

import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import type { z } from "zod";
import type { CreatePostSchema } from "@/types/zodSchema";
import { revalidatePath } from "next/cache";
import type { IPost } from "./types";
import { db } from "@/lib/db";

const SECRET = process.env.SECRET as string;

export async function fetchPosts() {
  try {
    const posts = await db.post.findMany({
      where: {
        isApproved: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return { success: posts };
  } catch (error) {
    console.log("Error:", error);
    return { error: "Something went wrong" };
  }
}

export async function fetchPost(postId: string) {
  try {
    const post = await db.post.findUnique({
      where: { id: postId },
      include: {
        seller: {
          select: {
            id: true,
            college: true,
            email: true,
            image: true,
            name: true,
            phoneNo: true,
          },
        },
        feeback: true,
      },
    });

    if (!post) {
      return { error: "No post found" };
    }

    const soldPostsWithFeedback = await db.post.findMany({
      where: {
        sellerId: post.seller.id,
        isAvailable: false,
        soldToUserId: { not: null },
        feeback: { NOT: undefined },
      },
      select: {
        feeback: {
          select: {
            rating: true,
          },
        },
      },
    });

    const ratings = soldPostsWithFeedback
      .map((item: { feeback: { rating: number } | null }) => item.feeback?.rating)
      .filter((rating: number | undefined | null): rating is number => typeof rating === "number");

    const totalRatings = ratings.length;
    const averageRating =
      totalRatings > 0
        ? Number.parseFloat(
            (ratings.reduce((a: number, b: number) => a + b, 0) / totalRatings).toFixed(2)
          )
        : null;

    return {
      success: {
        post: post as IPost,
        sellerStats: {
          totalSoldWithRating: totalRatings,
          averageRating,
        },
      },
    };
  } catch (error) {
    console.log("Error:", error);
    return { error: "Something went wrong" };
  }
}

export async function fetchFilteredPosts(category: string, query?: string) {
  try {
    const queryConditions: any = {
      isApproved: true,
    };
    
    if (query) {
      queryConditions.title = { contains: query, mode: "insensitive" };
    }

    if (category && category !== "ALL") {
      queryConditions.category = { equals: category };
    }

    const posts = await db.post.findMany({
      where: queryConditions,
    });

    return { success: posts };
  } catch (error) {
    console.log("Error:", error);
    return { error: "Something went wrong" };
  }
}

export async function createPost(values: z.infer<typeof CreatePostSchema>) {
  const session = cookies().get("session")?.value;

  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    const decoded = jwt.verify(session, SECRET) as { id: string };

    const { images, title, description, price, category } = values;

    await db.post.create({
      data: {
        title,
        description,
        images,
        price,
        category,
        sellerId: decoded.id,
      },
    });

    return { success: "Post created" };
  } catch (error) {
    console.log("Error:", error);
    return { error: "Something went wrong" };
  }
}

export async function updatePost(
  postId: string,
  modifiedData: Partial<{
    title?: string | undefined;
    category?: string | undefined;
    price?: string | undefined;
    description?: string | undefined;
    images?: string[] | undefined;
  }>
) {
  const session = cookies().get("session")?.value;
  
  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    const decoded = jwt.verify(session, SECRET) as { id: string };

    if (!modifiedData || Object.keys(modifiedData).length === 0) {
      return { error: "Nothing to update" };
    }

    const post = await db.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return { error: "Post not found" };
    }

    if (post.sellerId !== decoded.id) {
      return { error: "Unauthorized" };
    }

    await db.post.update({
      where: { id: postId },
      data: modifiedData,
    });

    revalidatePath("/profile");
    revalidatePath(`/profile/posts/${postId}`);
    revalidatePath(`/profile/posts/${postId}/edit`);
    return { success: "Post updated" };
  } catch (error) {
    console.log("Error:", error);
    return { error: "Something went wrong" };
  }
}

export async function postSold(postId: string, customerId: string) {
  const session = cookies().get("session")?.value;
  
  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    const decoded = jwt.verify(session, SECRET) as { id: string };

    const customerExists = await db.user.findFirst({
      where: { id: customerId },
    });

    if (!customerExists) {
      return { error: "Customer does not exists" };
    }

    const postExists = await db.post.findUnique({
      where: {
        id: postId,
        sellerId: decoded.id,
      },
    });

    if (!postExists) {
      return { error: "Post does not exists" };
    }

    await db.post.update({
      where: {
        id: postId,
        sellerId: decoded.id,
      },
      data: {
        isAvailable: false,
        soldToUserId: customerId,
      },
    });

    const chatToDelete = await db.chat.findFirst({
      where: {
        participants: {
          every: {
            id: {
              in: [decoded.id, customerId],
            },
          },
        },
      },
    });

    if (chatToDelete) {
      await db.message.deleteMany({
        where: {
          chatId: chatToDelete.id,
        },
      });

      await db.chat.delete({
        where: {
          id: chatToDelete.id,
        },
      });
    }

    return { success: "Updated post status" };
  } catch (error) {
    console.log("Error:", error);
    return { error: "Something went wrong" };
  }
}

export async function sendFeedback({
  postId,
  rating,
  remark,
}: {
  postId: string;
  rating: number;
  remark?: string;
}) {
  const session = cookies().get("session")?.value;
  
  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    const decoded = jwt.verify(session, SECRET) as { id: string };

    const postExists = await db.post.findUnique({
      where: {
        id: postId,
        soldToUserId: decoded.id,
      },
    });

    if (!postExists) {
      return { error: "Post not found" };
    }

    await db.feedback.create({
      data: {
        rating,
        text: remark ?? "",
        postId,
        customerId: decoded.id,
      },
    });

    return { success: "Feedback submitted successfully..." };
  } catch (error) {
    console.log("Error:", error);
    return { error: "Something went wrong" };
  }
}

export async function deletePost(postId: string) {
  const session = cookies().get("session")?.value;
  
  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    const decoded = jwt.verify(session, SECRET) as { id: string };

    const postExists = await db.post.findUnique({
      where: {
        id: postId,
        sellerId: decoded.id,
      },
    });

    if (!postExists) {
      return { error: "Post not found" };
    }

    await db.post.delete({ where: { id: postId, sellerId: decoded.id } });

    revalidatePath("/profile");
    return { success: "Post deleted" };
  } catch (error) {
    console.log("Error:", error);
    return { error: "Something went wrong" };
  }
}
