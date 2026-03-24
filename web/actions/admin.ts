"use server";

import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import type { IPost, IUserRequest } from "./types";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { resetAndSeedMarketplaceData } from "@/lib/reset-and-seed";

const SECRET = process.env.SECRET as string;

export async function adminHome() {
  const session = cookies().get("session")?.value;
  
  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    const decoded = jwt.verify(session, SECRET) as { id: string; role?: string };
    
    if (decoded.role !== "ADMIN") {
      return { error: "Unauthorized" };
    }

    const posts = await db.post.findMany({
      where: { isApproved: false },
      orderBy: {
        createdAt: "desc",
      },
    });

    const requests = await db.request.findMany({
      where: { isApproved: false },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { posts, requests };
  } catch (error) {
    console.log("Error:", error);
    return { error: "Something went wrong" };
  }
}

export async function requestDetails(id: string) {
  const session = cookies().get("session")?.value;
  
  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    const decoded = jwt.verify(session, SECRET) as { id: string; role?: string };
    
    if (decoded.role !== "ADMIN") {
      return { error: "Unauthorized" };
    }

    const request = await db.request.findFirst({
      where: { isApproved: false, id },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: request };
  } catch (error) {
    console.log("Error:", error);
    return { error: "Something went wrong" };
  }
}

export async function approvePost(id: string) {
  const session = cookies().get("session")?.value;
  
  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    const decoded = jwt.verify(session, SECRET) as { id: string; role?: string };
    
    if (decoded.role !== "ADMIN") {
      return { error: "Unauthorized" };
    }

    const post = await db.post.update({
      where: { id },
      data: {
        adminMessage: "Post verified and approved",
        isApproved: true,
      },
      include: {
        seller: true,
      },
    });

    await db.notification.create({
      data: {
        message: `Admin has verified and approved your post for ${post.title}`,
        actionId: decoded.id,
        targetId: post.sellerId,
        targetType: "ADMIN_APPROVE",
      },
    });

    revalidatePath("/admin/dashboard");
    return { success: "Post approved" };
  } catch (error) {
    console.log("Error:", error);
    return { error: "Something went wrong" };
  }
}

export async function rejectPost(id: string, reason: string) {
  const session = cookies().get("session")?.value;
  
  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    const decoded = jwt.verify(session, SECRET) as { id: string; role?: string };
    
    if (decoded.role !== "ADMIN") {
      return { error: "Unauthorized" };
    }

    const post = await db.post.update({
      where: { id },
      data: {
        adminMessage: reason,
        isApproved: false,
      },
      include: {
        seller: true,
      },
    });

    await db.notification.create({
      data: {
        message: `Admin has reject your post for ${post.title} and the reason is "${post.adminMessage}"`,
        actionId: decoded.id,
        targetId: post.sellerId,
        targetType: "ADMIN_REJECT",
      },
    });

    revalidatePath("/admin/dashboard");
    return { success: "Post rejected with the reason" };
  } catch (error) {
    console.log("Error:", error);
    return { error: "Something went wrong" };
  }
}

export async function approveRequest(id: string) {
  const session = cookies().get("session")?.value;
  
  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    const decoded = jwt.verify(session, SECRET) as { id: string; role?: string };
    
    if (decoded.role !== "ADMIN") {
      return { error: "Unauthorized" };
    }

    const request = await db.request.update({
      where: { id },
      data: {
        adminMessage: "Request verified and approved",
        isApproved: true,
      },
      include: {
        user: true,
      },
    });

    await db.notification.create({
      data: {
        message: `Admin has verified and approved your request for ${request.title}`,
        actionId: decoded.id,
        targetId: request.userId,
        targetType: "ADMIN_APPROVE",
      },
    });

    revalidatePath("/admin/dashboard");
    return { success: "Request approved" };
  } catch (error) {
    console.log("Error:", error);
    return { error: "Something went wrong" };
  }
}

export async function rejectRequest(id: string, reason: string) {
  const session = cookies().get("session")?.value;
  
  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    const decoded = jwt.verify(session, SECRET) as { id: string; role?: string };
    
    if (decoded.role !== "ADMIN") {
      return { error: "Unauthorized" };
    }

    const request = await db.request.update({
      where: { id },
      data: {
        adminMessage: reason,
        isApproved: false,
      },
      include: {
        user: true,
      },
    });

    await db.notification.create({
      data: {
        message: `Admin has reject your post for ${request.title} and the reason is "${request.adminMessage}"`,
        actionId: decoded.id,
        targetId: request.userId,
        targetType: "ADMIN_REJECT",
      },
    });

    revalidatePath("/admin/dashboard");
    return { success: "Request rejected with the reason" };
  } catch (error) {
    console.log("Error:", error);
    return { error: "Something went wrong" };
  }
}

export async function adminResetAndSeedMarketplace() {
  const session = cookies().get("session")?.value;

  if (!session) {
    return { error: "Unauthorized" };
  }

  const isAllowedInProduction =
    process.env.ALLOW_ADMIN_MARKETPLACE_SEED === "true";

  if (process.env.NODE_ENV === "production" && !isAllowedInProduction) {
    return {
      error:
        "This action is disabled in production. Set ALLOW_ADMIN_MARKETPLACE_SEED=true to enable.",
    };
  }

  try {
    const decoded = jwt.verify(session, SECRET) as { id: string; role?: string };

    if (decoded.role !== "ADMIN") {
      return { error: "Unauthorized" };
    }

    const result = await resetAndSeedMarketplaceData(db, {
      userCount: 10,
      postCount: 30,
      forceApproved: true,
    });

    revalidatePath("/home");
    revalidatePath("/admin/dashboard");

    return {
      success: `Seed complete: ${result.createdPosts} posts created for ${result.userCount} fake accounts.`,
    };
  } catch (error) {
    console.log("Error:", error);
    return { error: "Something went wrong" };
  }
}
