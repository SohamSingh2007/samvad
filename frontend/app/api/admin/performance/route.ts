import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:4000";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.search || "";
  const targetUrl = `${BACKEND_URL}/api/admin/performance${search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "host" && key.toLowerCase() !== "content-length") {
      headers.set(key, value);
    }
  });

  const tStart = Date.now();

  try {
    const backendRes = await fetch(targetUrl, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const data = await backendRes.json();
    const networkRtt = Date.now() - tStart;

    // Augment with measured client-to-proxy network roundtrip
    if (data && data.telemetry) {
      data.telemetry.clientNetworkRttMs = networkRtt;
    }

    return NextResponse.json(data, {
      status: backendRes.status,
    });
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || "Failed to reach backend performance telemetry" },
      { status: 502 }
    );
  }
}
