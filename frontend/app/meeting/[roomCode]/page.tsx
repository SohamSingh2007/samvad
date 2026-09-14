"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function MeetingRedirectPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const code = Array.isArray(params.roomCode)
      ? params.roomCode[0]
      : (params.roomCode as string) || "";
    router.replace(`/room/${code}`);
  }, [params, router]);

  return (
    <div className="w-full h-screen bg-[#121212] flex items-center justify-center text-white">
      <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
    </div>
  );
}
