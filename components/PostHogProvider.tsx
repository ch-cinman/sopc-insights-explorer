"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (key) {
      posthog.init(key, {
        api_host: "https://us.i.posthog.com",
        capture_pageview: true,
      });
    }
  }, []);

  return <>{children}</>;
}
