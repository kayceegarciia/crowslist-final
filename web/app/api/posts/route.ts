import { NextRequest, NextResponse } from "next/server";

const BASE_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:5000/api/v1";

export async function GET(request: NextRequest) {
  try {
    const session = request.cookies.get("session")?.value;

    const response = await fetch(`${BASE_URL}/posts`, {
      method: "GET",
      cache: "no-store",
      headers: {
        ...(session ? { Cookie: `session=${session}` } : {}),
      },
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      { msg: "Something went wrong while fetching posts" },
      { status: 500 }
    );
  }
}
