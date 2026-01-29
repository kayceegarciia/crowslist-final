import "dotenv/config";
const REDIS_URL = process.env.REDIS_URL as string;

import Redis from "ioredis";
import type { WebSocket } from "ws";
import { db } from "../utils/db";

// Make Redis optional: if REDIS_URL is not provided, skip initializing Redis.
let redisClient: Redis | null = null;
let redisPub: Redis | null = null;
let redisSub: Redis | null = null;
if (REDIS_URL && REDIS_URL.trim() !== "") {
  try {
    redisClient = new Redis(REDIS_URL);
    // attach a safe error handler to avoid unhandled error events
    redisClient.on("error", (err) => {
      console.error("[ioredis] client error:", err);
    });

    redisPub = redisClient.duplicate();
    redisPub.on("error", (err) => {
      console.error("[ioredis] pub error:", err);
    });

    redisSub = redisClient.duplicate();
    redisSub.on("error", (err) => {
      console.error("[ioredis] sub error:", err);
    });
  } catch (err) {
    console.error("Failed to initialize Redis client:", err);
    redisClient = null;
    redisPub = null;
    redisSub = null;
  }
}

interface Message {
  type: string;
  chatId: string;
  receiverId: string;
  userId: string;
  text: string;
}

const localOnlineUsers: { [userId: string]: WebSocket } = {};

// If we have a subscription client, subscribe to cross-instance messages
if (redisSub) {
  (async () => {
    try {
      await redisSub.subscribe("chat-messages");
    } catch (err) {
      console.error("[ioredis] failed to subscribe to chat-messages:", err);
    }
  })();

  redisSub.on("message", (channel, message) => {
    if (channel === "chat-messages") {
      try {
        const parsedMessage = JSON.parse(message);
        const rSocket = localOnlineUsers[parsedMessage.receiverId];

        if (rSocket) {
          rSocket.send(
            JSON.stringify({
              event: "new_message",
              newMessage: parsedMessage.newMessage,
            })
          );
        }
      } catch (err) {
        console.error("Failed to handle subscribed message:", err);
      }
    }
  });
}

export class UserManager {
  constructor(userId: string, socket: WebSocket) {
    localOnlineUsers[userId] = socket;
    if (redisClient) {
      // don't await here to avoid blocking connection setup
      redisClient.sadd("online-users", userId).catch((err) =>
        console.error("Failed to add online user to Redis:", err)
      );
    }

    socket.on("close", async () => {
      delete localOnlineUsers[userId];
      if (redisClient) {
        try {
          await redisClient.srem("online-users", userId);
        } catch (err) {
          console.error("Failed to remove online user from Redis:", err);
        }
      }
    });
  }

  async removeUser(userId: string) {
    delete localOnlineUsers[userId];
    if (redisClient) {
      try {
        await redisClient.srem("online-users", userId);
      } catch (err) {
        console.error("Failed to remove online user from Redis:", err);
      }
    }
  }

  async isUserOnline(userId: string) {
    if (redisClient) {
      try {
        const result = (await redisClient.sismember("online-users", userId)) === 1;
        return result;
      } catch (err) {
        console.error("Failed to check user online status in Redis:", err);
        // fallback to local in-memory map
        return Boolean(localOnlineUsers[userId]);
      }
    }
    // If Redis is not available, rely on local instance map only
    return Boolean(localOnlineUsers[userId]);
  }

  async sendMessage(message: Message) {
    const newMessage = await db.message.create({
      data: {
        type: "TEXT",
        chatId: message.chatId,
        senderId: message.userId,
        text: message.text,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (localOnlineUsers[message.userId]) {
      localOnlineUsers[message.userId].send(
        JSON.stringify({ event: "new_message", newMessage })
      );
    }

    const isReceiverOnline = await this.isUserOnline(message.receiverId);
    if (isReceiverOnline && redisPub) {
      try {
        redisPub.publish(
          "chat-messages",
          JSON.stringify({
            receiverId: message.receiverId,
            userId: message.userId,
            newMessage,
          })
        );
      } catch (err) {
        console.error("Failed to publish chat message to Redis:", err);
      }
    }
  }
}
