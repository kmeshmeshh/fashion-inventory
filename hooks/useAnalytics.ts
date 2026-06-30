"use client";

import { useQuery } from "@tanstack/react-query";

export type AnalyticsRange =
  | "this_month"
  | "last_month"
  | "all_time"
  | "custom";

export interface AnalyticsFilter {
  range: AnalyticsRange;
  from?: string; // YYYY-MM-DD, only used when range === "custom"
  to?: string; // YYYY-MM-DD, only used when range === "custom"
}

export const useAnalytics = (
  filter: AnalyticsFilter = { range: "this_month" },
) => {
  return useQuery({
    queryKey: ["analytics", filter],
    queryFn: async () => {
      const params = new URLSearchParams({ range: filter.range });
      if (filter.range === "custom" && filter.from && filter.to) {
        params.set("from", filter.from);
        params.set("to", filter.to);
      }
      const res = await fetch(`/api/analytics/dashboard?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
    refetchInterval: 60000, // Refetch every minute
  });
};
