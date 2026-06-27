/* eslint-disable @typescript-eslint/no-explicit-any */
// Search in orders
export const searchOrders = (orders: any[], query: string) => {
  if (!query) return orders;

  const lowerQuery = query.toLowerCase();
  return orders.filter(
    (order) =>
      order.order_number.toLowerCase().includes(lowerQuery) ||
      order.customer_name.toLowerCase().includes(lowerQuery) ||
      order.customer_phone?.toLowerCase().includes(lowerQuery),
  );
};

// Search in products
export const searchProducts = (products: any[], query: string) => {
  if (!query) return products;

  const lowerQuery = query.toLowerCase();
  return products.filter(
    (product) =>
      product.name.toLowerCase().includes(lowerQuery) ||
      product.sku.toLowerCase().includes(lowerQuery),
  );
};

// Filter orders by status
export const filterOrdersByStatus = (orders: any[], status: string) => {
  if (!status || status === "all") return orders;
  return orders.filter((order) => order.status === status);
};

// Filter orders by date range
export const filterOrdersByDate = (
  orders: any[],
  startDate: string,
  endDate: string,
) => {
  if (!startDate || !endDate) return orders;

  return orders.filter((order) => {
    const orderDate = new Date(order.created_at).toISOString().split("T")[0];
    return orderDate >= startDate && orderDate <= endDate;
  });
};

// Filter inventory by size
export const filterProductsBySize = (products: any[], size: string) => {
  if (!size || size === "all") return products;

  return products.filter((product) =>
    product.product_variants?.some(
      (v: any) => v.size === size && v.quantity > 0,
    ),
  );
};
