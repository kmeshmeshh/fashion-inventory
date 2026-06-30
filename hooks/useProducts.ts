"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Product, ProductVariant } from "@/lib/types";

export type CreateProductPayload = {
  sku: string;
  name: string;
  cost_per_unit: number;
  selling_price: number;
  category?: string | null;
  image_url?: string | null;
};

export type UpdateProductPayload = {
  id: number;
  sku?: string;
  name?: string;
  cost_per_unit?: number;
  selling_price?: number;
  category?: string | null;
  image_url?: string | null;
};

export type ProductWithVariants = Product & {
  product_variants?: ProductVariant[];
};

export type UpsertProductVariantPayload = {
  productId: number;
  size: string;
  quantity: number;
};

export const useProducts = () => {
  return useQuery<ProductWithVariants[]>({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await fetch("/api/products");
      if (!res.ok) {
        throw new Error(`Failed to fetch products: ${res.statusText}`);
      }
      return res.json();
    },
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation<Product, Error, CreateProductPayload>({
    mutationFn: async (data) => {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(responseData.error || "Failed to create product");
      }
      return responseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation<Product, Error, UpdateProductPayload>({
    mutationFn: async ({ id, ...data }) => {
      const res = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(responseData.error || "Failed to update product");
      }
      return responseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error, number>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });
      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(responseData.error || "Failed to delete product");
      }
      return responseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

export const useUpsertProductVariant = () => {
  const queryClient = useQueryClient();

  return useMutation<ProductVariant, Error, UpsertProductVariantPayload>({
    mutationFn: async ({ productId, size, quantity }) => {
      const res = await fetch(`/api/products/${productId}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ size, quantity }),
      });
      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(responseData.error || "Failed to update variant");
      }
      return responseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};
