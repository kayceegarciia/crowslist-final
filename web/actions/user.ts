"use server";

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import type { IUserNotification } from "./types";
import { db } from "@/lib/db";

const SECRET = process.env.SECRET as string;

export async function fetchUserProfile() {
  const session = cookies().get("session")?.value;
  
  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    const decoded = jwt.verify(session, SECRET) as { id: string };

    const user = await db.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        image: true,
        email: true,
        name: true,
        posts: true,
        purchasedItems: {
          include: {
            feeback: true,
          },
        },
        phoneNo: true,
        college: true,
        requests: {
          include: {
            _count: {
              select: {
                upVotes: true,
              },
            },
            user: {
              select: {
                id: true,
                image: true,
                email: true,
                phoneNo: true,
                college: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return { success: user };
  } catch (error) {
    console.log("Error:", error);
    return { error: "Something went wrong" };
  }
}

export async function updateProfile(
  modifiedData: Partial<{
    name?: string | undefined;
    password?: string | undefined;
    phoneNo?: string | undefined;
    image?: string | undefined;
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

    const user = await db.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return { error: "User not found" };
    }

    const updateData: any = {};
    
    if (modifiedData.name) updateData.name = modifiedData.name;
    if (modifiedData.image) updateData.image = modifiedData.image;
    if (modifiedData.phoneNo) updateData.phoneNo = modifiedData.phoneNo;
    if (modifiedData.password) {
      updateData.password = await bcrypt.hash(modifiedData.password, 10);
    }

    await db.user.update({
      where: { id: decoded.id },
      data: updateData,
    });

    revalidatePath("/profile");
    return { success: "Profile updated" };
  } catch (error) {
    console.log("Error:", error);
    return { error: "Something went wrong" };
  }
}

export async function deleteUser() {
  const session = cookies().get("session")?.value;
  
  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    const decoded = jwt.verify(session, SECRET) as { id: string };

    const user = await db.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return { error: "User not found" };
    }

    const posts = await db.post.findMany({ where: { sellerId: decoded.id } });

    if (posts.length > 0) {
      return { error: "Delete all your listings first" };
    }

    const requests = await db.request.findMany({ where: { userId: decoded.id } });

    if (requests.length > 0) {
      return { error: "Delete all your requests first" };
    }

    await db.user.delete({ where: { id: decoded.id } });

    return { success: "Account is deleted" };
  } catch (error) {
    console.log("Error:", error);
    return { error: "Something went wrong" };
  }
}

export async function fetchUserNotifications() {
  const session = cookies().get("session")?.value;
  
  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    const decoded = jwt.verify(session, SECRET) as { id: string };

    const notifications = await db.notification.findMany({
      where: {
        targetId: decoded.id,
        read: false,
      },
      include: {
        action: {
          select: {
            id: true,
            image: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: notifications };
  } catch (error) {
    console.log("Error:", error);
    return { error: "Something went wrong" };
  }
}

export async function markAsRead(id: string) {
  const session = cookies().get("session")?.value;
  
  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    jwt.verify(session, SECRET);

    await db.notification.update({
      where: {
        id,
      },
      data: {
        read: true,
      },
    });

    revalidatePath("/notifications");
    revalidatePath("/home");
    return { success: "Notification marked as read" };
  } catch (error) {
    console.log("Error:", error);
    return { error: "Something went wrong" };
  }
}
