"use client";

import { useQuery } from "@tanstack/react-query";

export const useAnalytics = () => {
  return useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/dashboard");
      return res.json();
    },
    refetchInterval: 60000, // Refetch every minute
  });
};
