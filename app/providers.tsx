"use client";
import { useEffect } from "react";
import sdk from "@farcaster/miniapp-sdk";

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  return <>{children}</>;
}
