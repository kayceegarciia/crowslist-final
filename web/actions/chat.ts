"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import jwt from "jsonwebtoken";
import { db } from "@/lib/db";

const SECRET = process.env.SECRET as string;

export async function getAllChats() {
  try {
    const session = cookies().get("session")?.value;
    if (!session) {
      return { error: "Unauthorized" };
    }

    const decoded = jwt.verify(session, SECRET) as { id: string };
    const userId = decoded.id;

    const user = await db.user.findFirst({ where: { id: userId } });
    if (!user) {
      return { error: "User not found" };
    }

    const chats = await db.chat.findMany({
      where: {
        participants: {
          some: { id: userId },
        },
      },
      include: {
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                image: true,
                name: true,
                college: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        participants: {
          select: {
            id: true,
            name: true,
            image: true,
            college: true,
          },
        },
      },
    });

    if (chats.length === 0) {
      return { error: "No chat found" };
    }

    return { success: chats };
  } catch (error) {
    console.error("Error fetching chats:", error);
    return { error: "Failed to fetch chats" };
  }
}

export async function getChat(id: string) {
  try {
    const session = cookies().get("session")?.value;
    if (!session) {
      return { error: "Unauthorized" };
    }

    const decoded = jwt.verify(session, SECRET) as { id: string };
    const userId = decoded.id;

    const user = await db.user.findFirst({ where: { id: userId } });
    if (!user) {
      return { error: "User not found" };
    }

    const chat = await db.chat.findFirst({
      where: { id },
      include: {
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                image: true,
                name: true,
                college: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        participants: {
          select: {
            id: true,
            image: true,
            name: true,
            college: true,
          },
        },
      },
    });

    if (!chat) {
      return { error: "Chat not found" };
    }

    return { success: chat };
  } catch (error) {
    console.error("Error fetching chat:", error);
    return { error: "Failed to fetch chat" };
  }
}

export async function startChat(withUserId: string) {
  try {
    const session = cookies().get("session")?.value;
    if (!session) {
      return { error: "Unauthorized" };
    }

    const decoded = jwt.verify(session, SECRET) as { id: string };
    const userId = decoded.id;

    if (userId === withUserId) {
      return { error: "You cannot chat with yourself" };
    }

    const userExists = await db.user.findFirst({ where: { id: userId } });
    const withUserExists = await db.user.findFirst({ where: { id: withUserId } });
    
    if (!userExists || !withUserExists) {
      return { error: "One or both users not found" };
    }

    const chatExists = await db.chat.findFirst({
      where: {
        participants: {
          some: { id: userId },
        },
        AND: {
          participants: {
            some: { id: withUserId },
          },
        },
      },
    });

    if (!chatExists) {
      const newChat = await db.chat.create({
        data: {
          participants: {
            connect: [
              { id: userId },
              { id: withUserId },
            ],
          },
        },
      });

      revalidatePath("/messages");
      revalidatePath(`/messages/${newChat.id}`);
      return { success: newChat.id };
    }

    revalidatePath("/messages");
    return { success: "REDIRECT", chatId: chatExists.id };
  } catch (error) {
    console.error("Error starting chat:", error);
    return { error: "Failed to start chat" };
  }
}

export async function sendMessage(chatId: string, text: string) {
  try {
    const session = cookies().get("session")?.value;
    if (!session) {
      return { error: "Unauthorized" };
    }

    const decoded = jwt.verify(session, SECRET) as { id: string };
    const userId = decoded.id;

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { error: "User not found" };
    }

    const chatExists = await db.chat.findFirst({ where: { id: chatId } });
    if (!chatExists) {
      return { error: "Chat not found" };
    }

    await db.message.create({
      data: {
        chatId: chatExists.id,
        senderId: user.id,
        type: "TEXT",
        text,
      },
    });

    revalidatePath("/messages");
    revalidatePath(`/messages/${chatId}`);
    return { success: "Message sent" };
  } catch (error) {
    console.error("Error sending message:", error);
    return { error: "Failed to send message" };
  }
}
