import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:4000";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.search || "";
  const targetUrl = `${BACKEND_URL}/api/admin/users${search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "host" && key.toLowerCase() !== "content-length") {
      headers.set(key, value);
    }
  });

  try {
    const backendRes = await fetch(targetUrl, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const data = await backendRes.text();
    return new NextResponse(data, {
      status: backendRes.status,
      headers: {
        "Content-Type": backendRes.headers.get("content-type") || "application/json",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || "Failed to reach backend server" },
      { status: 502 }
    );
  }
}
