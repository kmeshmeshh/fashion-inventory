/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const useShippingCities = () =>
  useQuery({
    queryKey: ["shippingCities"],
    queryFn: async () => {
      const res = await fetch("/api/shipping-cities");
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || "Failed to fetch shipping cities");
      }
      return json;
    },
  });

export const useCreateShippingCity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/shipping-cities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(responseData.error || "Failed to create shipping city");
      }
      return responseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shippingCities"] });
    },
  });
};
