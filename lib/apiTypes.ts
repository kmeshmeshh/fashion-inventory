import { z } from "zod";

export const productVariantSchema = z.object({
  id: z.number().optional(),
  product_id: z.number().optional(),
  size: z.string().min(1),
  quantity: z.coerce.number().int().nonnegative(),
});

export const productVariantCreateSchema = productVariantSchema.pick({
  size: true,
  quantity: true,
});

export const productVariantBulkCreateSchema = z
  .array(productVariantCreateSchema)
  .min(1);

export const productSchema = z.object({
  id: z.number().optional(),
  sku: z.string().min(1),
  name: z.string().min(1),
  cost_per_unit: z.coerce.number().nonnegative(),
  selling_price: z.coerce.number().nonnegative(),
  category: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  product_variants: z.array(productVariantSchema).optional(),
});

export const createProductSchema = productSchema.omit({
  id: true,
  product_variants: true,
});

export const updateProductSchema = productSchema
  .pick({
    sku: true,
    name: true,
    cost_per_unit: true,
    selling_price: true,
    category: true,
    image_url: true,
  })
  .partial();

export const inventoryLogSchema = z.object({
  id: z.number().optional(),
  product_id: z.number(),
  quantity_changed: z.number(),
  reason: z.enum(["restock", "adjustment", "order"]),
  reference_id: z.number().nullable().optional(),
  created_by: z.string().optional(),
  created_at: z.string().optional(),
});

export const createInventoryLogSchema = inventoryLogSchema.omit({
  id: true,
  created_at: true,
});

export const createOrderItemSchema = z.object({
  product_id: z.number(),
  size: z.string().min(1),
  quantity: z.coerce.number().int().min(1),
  price_at_sale: z.coerce.number().nonnegative(),
});

export const createOrderSchema = z.object({
  customer_name: z.string().min(1),
  customer_phone: z.string().optional().nullable(),
  customer_address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  shipped_with_courier: z.boolean().optional(),
  source: z.string().optional().nullable(),
  shipping_city_id: z.number().int().optional().nullable(),
  discount: z.coerce.number().nonnegative().optional(),
  items: z.array(createOrderItemSchema).min(1),
});

export type Product = z.infer<typeof productSchema>;
export type ProductVariant = z.infer<typeof productVariantSchema>;
export type InventoryLog = z.infer<typeof inventoryLogSchema>;
export type CreateOrder = z.infer<typeof createOrderSchema>;
export type CreateOrderItem = z.infer<typeof createOrderItemSchema>;
