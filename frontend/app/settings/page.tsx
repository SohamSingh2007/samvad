"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import SettingsSectionPage from "./[section]/page";

export default function SettingsRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/settings/accounts");
  }, [router]);

  return <SettingsSectionPage />;
}
