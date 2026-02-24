"use server";

import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import type { z } from "zod";
import type { CreateRequestSchema } from "@/types/zodSchema";
import { db } from "@/lib/db";

const SECRET = process.env.SECRET as string;

export async function fetchRequests() {
  try {
    const requests = await db.request.findMany({
      where: {
        isApproved: true,
      },
      orderBy: {
        upVotes: {
          _count: "desc",
        },
      },
      include: {
        _count: {
          select: {
            upVotes: true,
          },
        },
        user: {
          select: {
            college: true,
            email: true,
            image: true,
            name: true,
            phoneNo: true,
          },
        },
      },
    });

    return { success: requests };
  } catch (error) {
    console.log("Error:", error);
    return { error: "Something went wrong" };
  }
}

export async function createRequest(
  values: z.infer<typeof CreateRequestSchema>
) {
  const session = cookies().get("session")?.value;
  
  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    const decoded = jwt.verify(session, SECRET) as { id: string };

    const { image, title, description } = values;

    await db.request.create({
      data: {
        title,
        description,
        image,
        userId: decoded.id,
      },
    });

    return { success: "Request created" };
  } catch (error) {
    console.log("Error:", error);
    return { error: "Something went wrong" };
  }
}

export async function upVoteRequest(requestId: string) {
  const session = cookies().get("session")?.value;
  
  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    const decoded = jwt.verify(session, SECRET) as { id: string };

    const requestExists = await db.request.findUnique({
      where: {
        id: requestId,
      },
    });

    if (!requestExists) {
      return { error: "Request doesn't exists" };
    }

    const alreadyUpVoted = await db.upVote.findUnique({
      where: {
        requestId_userId: {
          requestId,
          userId: decoded.id,
        },
      },
    });

    if (!alreadyUpVoted) {
      await db.upVote.create({ data: { requestId, userId: decoded.id } });
      return { success: "Upvoted" };
    }

    await db.upVote.delete({
      where: {
        requestId_userId: {
          requestId,
          userId: decoded.id,
        },
      },
    });
    return { success: "Removed upvote" };
  } catch (error) {
    console.log("Error:", error);
    return { error: "Something went wrong" };
  }
}

export async function deleteRequest(requestId: string) {
  const session = cookies().get("session")?.value;
  
  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    const decoded = jwt.verify(session, SECRET) as { id: string };

    const requestExists = await db.request.findUnique({ 
      where: { id: requestId, userId: decoded.id } 
    });

    if (!requestExists) {
      return { error: "Request doesn't exists" };
    }

    await db.request.delete({ where: { id: requestId } });

    return { success: "Request deleted" };
  } catch (error) {
    console.log("Error:", error);
    return { error: "Something went wrong" };
  }
}
