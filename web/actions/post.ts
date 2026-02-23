"use server";

import axios, { AxiosError } from "axios";

import { cookies, headers } from "next/headers";
import type { z } from "zod";
import type { CreatePostSchema } from "@/types/zodSchema";
import { revalidatePath } from "next/cache";
import type { IPost } from "./types";
import { db } from "@/lib/db";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

function getAppBaseUrl() {
  const headerStore = headers();
  const forwardedHost = headerStore.get("x-forwarded-host");
  const host = forwardedHost || headerStore.get("host");
  const forwardedProto = headerStore.get("x-forwarded-proto");
  const protocol =
    forwardedProto || (process.env.NODE_ENV === "development" ? "http" : "https");

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  if (host) {
    return `${protocol}://${host}`;
  }

  return "http://localhost:3000";
}

export async function fetchPosts() {
  const session = cookies().get("session")?.value;
  const APP_BASE_URL = getAppBaseUrl();
  try {
    const response = await axios.get(`${APP_BASE_URL}/api/posts`, {
      withCredentials: true,
      headers: {
        Cookie: `session=${session}`,
      },
    });

    if (response.status === 200) {
      const data = await response.data.posts;
      return { success: data };
    }
  } catch (error) {
    if (error instanceof AxiosError) {
      const errorData = await error.response?.data.msg;
      return { error: errorData };
    }
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
      .map((item) => item.feeback?.rating)
      .filter((rating): rating is number => typeof rating === "number");

    const totalRatings = ratings.length;
    const averageRating =
      totalRatings > 0
        ? Number.parseFloat(
            (ratings.reduce((a, b) => a + b, 0) / totalRatings).toFixed(2)
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
  const session = cookies().get("session")?.value;
  const APP_BASE_URL = getAppBaseUrl();
  try {
    const response = await axios.get(
      `${APP_BASE_URL}/api/posts/filters?q=${query}&category=${category}`,
      {
        withCredentials: true,
        headers: {
          Cookie: `session=${session}`,
        },
      }
    );

    if (response.status === 200) {
      const data = await response.data.posts;
      return { success: data };
    }
  } catch (error) {
    if (error instanceof AxiosError) {
      const errorData = await error.response?.data.msg;
      return { error: errorData };
    }
  }
}

export async function createPost(values: z.infer<typeof CreatePostSchema>) {
  const session = cookies().get("session")?.value;

  try {
    const response = await axios.post(`${BASE_URL}/posts`, values, {
      withCredentials: true,
      headers: {
        Cookie: `session=${session}`,
      },
    });

    if (response.status === 201) {
      const data = await response.data.msg;
      return { success: data };
    }
  } catch (error) {
    if (error instanceof AxiosError) {
      const errorData = error.response?.data.msg;
      console.log(errorData);
      if (errorData) {
        // if (typeof errorData === "object") {
        //   // biome-ignore lint/complexity/noForEach: <explanation>
        //   Object.entries(errorData).forEach(async ([field, message]) => {
        //     toast.error(`${field}: ${message}`);
        //   });
        // }
      }
    }
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
  try {
    if (modifiedData) {
      const response = await axios.patch(
        `${BASE_URL}/posts/${postId}`,
        modifiedData,
        {
          withCredentials: true,
          headers: {
            Cookie: `session=${session}`,
          },
        }
      );

      if (response.status === 200) {
        const data = await response.data.msg;
        revalidatePath("/profile");
        revalidatePath(`/profile/posts/${postId}`);
        revalidatePath(`/profile/posts/${postId}/edit`);
        return { success: data };
      }
    } else {
      return { error: "Nothing to update" };
    }
  } catch (error) {
    if (error instanceof AxiosError) {
      const errorData = await error.response?.data.msg;
      return { error: errorData };
    }
  }
}

export async function postSold(postId: string, customerId: string) {
  const session = cookies().get("session")?.value;
  try {
    const response = await axios.patch(
      `${BASE_URL}/posts/${postId}/sold`,
      { customerId },
      {
        withCredentials: true,
        headers: {
          Cookie: `session=${session}`,
        },
      }
    );

    if (response.status === 200) {
      const data = await response.data.msg;
      console.log(data);
      return { success: data };
    }
  } catch (error) {
    if (error instanceof AxiosError) {
      const errorData = await error.response?.data.msg;
      return { error: errorData };
    }
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
  try {
    const response = await axios.post(
      `${BASE_URL}/posts/feedback/${postId}`,
      { rating, remark },
      {
        withCredentials: true,
        headers: {
          Cookie: `session=${session}`,
        },
      }
    );

    if (response.status === 201) {
      const data = await response.data.msg;
      return { success: data };
    }
  } catch (error) {
    if (error instanceof AxiosError) {
      const errorData = await error.response?.data.msg;
      return { error: errorData };
    }
  }
}

export async function deletePost(postId: string) {
  const session = cookies().get("session")?.value;
  try {
    const response = await axios.delete(`${BASE_URL}/posts/${postId}`, {
      withCredentials: true,
      headers: {
        Cookie: `session=${session}`,
      },
    });

    if (response.status === 200) {
      const data = await response.data.msg;
      revalidatePath("/profile");
      return { success: data };
    }
  } catch (error) {
    if (error instanceof AxiosError) {
      const errorData = await error.response?.data.msg;
      return { error: errorData };
    }
  }
}
