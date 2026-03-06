"use server";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

import type { z } from "zod";
import { db } from "@/lib/db";
import { LoginSchema, SignupSchema } from "@/types/zodSchema";

const SECRET = process.env.SECRET as string;

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

function formatZodErrors(errors: z.ZodFormattedError<unknown>) {
  const errorMessages: Record<string, string> = {};

  Object.entries(errors).forEach(([field, error]) => {
    if (field !== "_errors") {
      if (Array.isArray(error)) {
        errorMessages[field] = error.join(", ");
      } else if (typeof error === "object" && error && "_errors" in error) {
        const fieldErrors = (error as { _errors?: string[] })._errors || [];
        errorMessages[field] = fieldErrors.join(", ");
      }
    }
  });

  return errorMessages;
}

export async function signupAction(values: z.infer<typeof SignupSchema>) {
  const result = SignupSchema.safeParse(values);

  if (!result.success) {
    const errors = result.error.format();
    return { error: formatZodErrors(errors) };
  }

  const { email, name, password, college, phoneNo, image } = result.data;

  try {
    const userExists = await db.user.findUnique({
      where: { email },
    });

    if (userExists) {
      return { error: "Account already exists. Please login!" };
    }

    const hashPass = await bcrypt.hash(password, 10);

    const newUser = await db.user.create({
      data: {
        email,
        name,
        password: hashPass,
        college,
        phoneNo,
        image,
      },
    });

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      SECRET
    );

    const cookieStore = cookies();
    cookieStore.set("session", token, cookieOptions);
    cookieStore.set("uid", newUser.id, cookieOptions);

    return { success: "Account created!", token, uid: newUser.id };
  } catch (error) {
    console.log("Error:", error);
    return { error: "Something went wrong!" };
  }
}

export async function loginAction(values: z.infer<typeof LoginSchema>) {
  const result = LoginSchema.safeParse(values);

  if (!result.success) {
    const errors = result.error.format();
    return { error: formatZodErrors(errors) };
  }

  const { email, password } = result.data;

  try {
    const userExists = await db.user.findUnique({
      where: { email },
    });

    if (!userExists) {
      return { error: "Please create an account!" };
    }

    const validPass = await bcrypt.compare(password, userExists.password);

    if (!validPass) {
      return { error: "Incorrect credentials!" };
    }

    const token = jwt.sign({ id: userExists.id, role: userExists.role }, SECRET);

    const cookieStore = cookies();
    cookieStore.set("session", token, cookieOptions);
    cookieStore.set("uid", userExists.id, cookieOptions);

    return { success: "Credentials verified!", token, uid: userExists.id };
  } catch (error) {
    console.log("Error:", error);
    return { error: "Something went wrong!" };
  }
}

export async function adminLoginAction(values: z.infer<typeof LoginSchema>) {
  const result = LoginSchema.safeParse(values);

  if (!result.success) {
    const errors = result.error.format();
    return { error: formatZodErrors(errors) };
  }

  const { email, password } = result.data;

  try {
    const userExists = await db.user.findUnique({
      where: { email, role: "ADMIN" },
    });

    if (!userExists) {
      return { error: "Please create an account!" };
    }

    const validPass = await bcrypt.compare(password, userExists.password);

    if (!validPass) {
      return { error: "Incorrect credentials!" };
    }

    const token = jwt.sign(
      { id: userExists.id, email: userExists.email, role: userExists.role },
      SECRET
    );

    const cookieStore = cookies();
    cookieStore.set("session", token, cookieOptions);
    cookieStore.set("uid", userExists.id, cookieOptions);

    return { success: "Credentials verified!", token, uid: userExists.id };
  } catch (error) {
    console.log("Error:", error);
    return { error: "Something went wrong!" };
  }
}

export async function logoutAction() {
  const cookieStore = cookies();
  cookieStore.delete("session");
  cookieStore.delete("uid");

  return { success: "Logging out!" };
}
