"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import jwt from "jsonwebtoken";
import { db } from "@/lib/db";

const SECRET = process.env.SECRET as string;

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

export async function deleteMessage(chatId: string, messageId: string) {
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

    await db.message.delete({
      where: { id: messageId },
    });

    revalidatePath("/messages");
    revalidatePath(`/messages/${chatId}`);
    return { success: "Message deleted" };
  } catch (error) {
    console.error("Error deleting message:", error);
    return { error: "Failed to delete message" };
  }
}
