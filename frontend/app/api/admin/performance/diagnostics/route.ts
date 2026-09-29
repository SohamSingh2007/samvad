import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:4000";

export async function POST(request: NextRequest) {
  const targetUrl = `${BACKEND_URL}/api/admin/performance/diagnostics`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "host" && key.toLowerCase() !== "content-length") {
      headers.set(key, value);
    }
  });

  const tStart = Date.now();

  try {
    const backendRes = await fetch(targetUrl, {
      method: "POST",
      headers,
      cache: "no-store",
    });

    const data = await backendRes.json();
    const networkLatencyMs = Date.now() - tStart;

    if (data) {
      data.totalTripMs = networkLatencyMs;
    }

    return NextResponse.json(data, {
      status: backendRes.status,
    });
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || "Failed to execute diagnostic test" },
      { status: 502 }
    );
  }
}
