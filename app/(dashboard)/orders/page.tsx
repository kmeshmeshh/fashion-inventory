/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useCallback } from "react";
import { useOrders, useCreateOrder, useUpdateOrder } from "@/hooks/useOrders";
import { useProducts } from "@/hooks/useProducts";
import { useAuth } from "@/hooks/useAuth";
import {
  searchOrders,
  filterOrdersByStatus,
  filterOrdersByDate,
} from "@/lib/filters";

const ORDER_STATUSES = [
  "pending",
  "prepared",
  "shipped",
  "delivered",
  "cancelled",
];

export default function OrdersPage() {
  const { data: orders, isLoading, refetch: refetchOrders } = useOrders();
  const { data: products } = useProducts();
  const createOrder = useCreateOrder();
  const updateOrder = useUpdateOrder();
  const { token } = useAuth();

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_phone: "",
    customer_address: "",
    notes: "",
    shipped_with_courier: false,
  });
  const [items, setItems] = useState<any[]>([]);
  const [newItem, setNewItem] = useState({
    product_id: "",
    size: "",
    quantity: "",
  });
  const [variants, setVariants] = useState<any[]>([]);

  const handleProductSelect = useCallback(async (productId: string) => {
    setNewItem({ product_id: productId, size: "", quantity: "" });

    if (!productId) {
      setVariants([]);
      return;
    }

    try {
      const res = await fetch(`/api/products/${productId}/variants`);
      if (res.ok) {
        const data = await res.json();
        setVariants(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Load variants error:", err);
      setVariants([]);
    }
  }, []);

  const handleAddItem = () => {
    if (!newItem.product_id || !newItem.size || !newItem.quantity) {
      alert("ملء جميع الحقول");
      return;
    }

    const qty = parseInt(newItem.quantity);
    const variant = variants.find((v) => v.size === newItem.size);

    if (!variant || variant.quantity < qty) {
      alert(`لا توجد كمية كافية من المقاس ${newItem.size}`);
      return;
    }

    const product = products?.find(
      (p: any) => p.id === parseInt(newItem.product_id),
    );
    if (!product) {
      alert("المنتج غير موجود");
      return;
    }

    setItems([
      ...items,
      {
        product_id: parseInt(newItem.product_id),
        size: newItem.size,
        quantity: qty,
        price_at_sale: product.selling_price,
      },
    ]);

    setNewItem({ product_id: "", size: "", quantity: "" });
    setVariants([]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const totalPrice = items.reduce(
    (sum, item) => sum + item.quantity * item.price_at_sale,
    0,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      alert("أضف منتج واحد على الأقل");
      return;
    }

    if (!token) {
      alert("غير مصرح");
      return;
    }

    setLoading(true);

    try {
      await createOrder.mutateAsync({
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        customer_address: formData.customer_address,
        notes: formData.notes,
        shipped_with_courier: formData.shipped_with_courier,
        items,
        token,
      });

      setFormData({
        customer_name: "",
        customer_phone: "",
        customer_address: "",
        notes: "",
        shipped_with_courier: false,
      });
      setItems([]);
      setShowForm(false);
      alert("✅ تم إنشاء الطلب!");
    } catch (err) {
      alert("❌ خطأ: " + (err instanceof Error ? err.message : "حدث خطأ"));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      await updateOrder.mutateAsync({
        id: orderId,
        status: newStatus,
      });
    } catch (err) {
      alert("❌ خطأ في تحديث الحالة");
    }
  };

  const handleItemStatusChange = async (itemId: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/order-items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update");

      await refetchOrders();
    } catch (err) {
      alert("❌ خطأ في تحديث حالة المنتج");
    }
  };

  const availableSizes = variants
    .filter((v) => v.quantity > 0)
    .map((v) => v.size);

  // Apply search and filters
  let filteredOrders = orders || [];
  filteredOrders = searchOrders(filteredOrders, searchQuery);
  filteredOrders = filterOrdersByStatus(filteredOrders, filterStatus);
  filteredOrders = filterOrdersByDate(
    filteredOrders,
    filterStartDate,
    filterEndDate,
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">🛒 الطلبات</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          {showForm ? "إلغاء" : "➕ إنشاء طلب"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Info */}
            <div>
              <h3 className="text-lg font-bold mb-4">معلومات العميل</h3>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="اسم العميل"
                  value={formData.customer_name}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_name: e.target.value })
                  }
                  required
                  className="border rounded px-3 py-2"
                />
                <input
                  type="tel"
                  placeholder="الهاتف"
                  value={formData.customer_phone}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_phone: e.target.value })
                  }
                  className="border rounded px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="العنوان"
                  value={formData.customer_address}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      customer_address: e.target.value,
                    })
                  }
                  className="border rounded px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="ملاحظات"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="border rounded px-3 py-2"
                />
              </div>

              <div className="mt-4 flex items-center">
                <input
                  type="checkbox"
                  id="shipped"
                  checked={formData.shipped_with_courier}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      shipped_with_courier: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="shipped" className="ml-2 text-sm font-medium">
                  📦 شحن عبر شركة توصيل
                </label>
              </div>
            </div>

            {/* Add Items */}
            <div>
              <h3 className="text-lg font-bold mb-4">منتجات الطلب</h3>

              <div className="space-y-4 mb-4 p-4 bg-gray-50 rounded">
                <div className="grid grid-cols-5 gap-3">
                  <div>
                    <label className="block text-sm mb-1 font-medium">
                      المنتج
                    </label>
                    <select
                      value={newItem.product_id}
                      onChange={(e) => handleProductSelect(e.target.value)}
                      className="border rounded px-3 py-2 w-full"
                    >
                      <option value="">اختر</option>
                      {products?.map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm mb-1 font-medium">
                      المقاس
                    </label>
                    <select
                      value={newItem.size}
                      onChange={(e) =>
                        setNewItem({ ...newItem, size: e.target.value })
                      }
                      disabled={!newItem.product_id}
                      className="border rounded px-3 py-2 w-full disabled:bg-gray-100"
                    >
                      <option value="">اختر</option>
                      {availableSizes.map((size) => {
                        const v = variants.find((v) => v.size === size);
                        return (
                          <option key={size} value={size}>
                            {size} ({v?.quantity})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm mb-1 font-medium">
                      الكمية
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newItem.quantity}
                      onChange={(e) =>
                        setNewItem({ ...newItem, quantity: e.target.value })
                      }
                      disabled={!newItem.size}
                      className="border rounded px-3 py-2 w-full disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-1 font-medium">
                      السعر
                    </label>
                    <input
                      type="text"
                      value={
                        newItem.product_id
                          ? products?.find(
                              (p: any) => p.id === parseInt(newItem.product_id),
                            )?.selling_price || 0
                          : 0
                      }
                      disabled
                      className="border rounded px-3 py-2 w-full bg-gray-100"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded w-full"
                    >
                      إضافة
                    </button>
                  </div>
                </div>
              </div>

              {items.length > 0 && (
                <div className="overflow-hidden border rounded mb-4">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left">المنتج</th>
                        <th className="px-4 py-2 text-left">المقاس</th>
                        <th className="px-4 py-2 text-center">الكمية</th>
                        <th className="px-4 py-2 text-right">السعر</th>
                        <th className="px-4 py-2 text-right">الإجمالي</th>
                        <th className="px-4 py-2 text-center">حذف</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => {
                        const product = products?.find(
                          (p: any) => p.id === item.product_id,
                        );
                        return (
                          <tr key={idx} className="border-t">
                            <td className="px-4 py-2">{product?.name}</td>
                            <td className="px-4 py-2">{item.size}</td>
                            <td className="px-4 py-2 text-center">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {item.price_at_sale} EGP
                            </td>
                            <td className="px-4 py-2 text-right font-bold">
                              {(item.quantity * item.price_at_sale).toFixed(2)}{" "}
                              EGP
                            </td>
                            <td className="px-4 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="text-red-600 hover:underline text-sm"
                              >
                                حذف
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="border-t bg-blue-50 font-bold">
                        <td colSpan={4} className="px-4 py-2 text-right">
                          الإجمالي:
                        </td>
                        <td className="px-4 py-2 text-right">
                          {totalPrice.toFixed(2)} EGP
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || items.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded disabled:opacity-50 w-full"
            >
              {loading ? "جاري الإنشاء..." : "إنشاء الطلب"}
            </button>
          </form>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">🔍 بحث</label>
            <input
              type="text"
              placeholder="اسم / رقم طلب / هاتف"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border rounded px-3 py-2 w-full text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">الحالة</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border rounded px-3 py-2 w-full text-sm"
            >
              <option value="all">الكل</option>
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">من التاريخ</label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="border rounded px-3 py-2 w-full text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              إلى التاريخ
            </label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="border rounded px-3 py-2 w-full text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">&nbsp;</label>
            <button
              onClick={() => {
                setSearchQuery("");
                setFilterStatus("all");
                setFilterStartDate("");
                setFilterEndDate("");
              }}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded w-full text-sm"
            >
              🔄 إعادة تعيين
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          النتائج: {filteredOrders.length} طلب
        </p>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <p className="text-center">⏳ جاري التحميل...</p>
      ) : filteredOrders.length === 0 ? (
        <p className="text-center text-gray-500 py-8">لا توجد طلبات مطابقة</p>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order: any) => (
            <div
              key={order.id}
              className={`bg-white rounded-lg shadow p-6 border-l-4 ${
                order.shipped_with_courier
                  ? "border-l-purple-500"
                  : "border-l-gray-200"
              }`}
            >
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">رقم الطلب</p>
                  <p className="font-bold">{order.order_number}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">العميل</p>
                  <p className="font-medium">{order.customer_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">الإجمالي</p>
                  <p className="font-bold text-green-600">
                    {order.total_price} EGP
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">الحالة</p>
                  <div className="flex items-center gap-2">
                    <select
                      value={order.status}
                      onChange={(e) =>
                        handleStatusChange(order.id, e.target.value)
                      }
                      className={`px-2 py-1 rounded text-xs font-medium text-white ${
                        order.status === "pending"
                          ? "bg-yellow-500"
                          : order.status === "prepared"
                            ? "bg-blue-500"
                            : order.status === "shipped"
                              ? "bg-purple-500"
                              : order.status === "delivered"
                                ? "bg-green-500"
                                : "bg-red-500"
                      }`}
                    >
                      {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    {order.shipped_with_courier && (
                      <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                        📦
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500">التاريخ</p>
                  <p className="text-sm">
                    {new Date(order.created_at).toLocaleDateString("ar-EG")}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div className="mt-4 p-4 bg-gray-50 rounded">
                <p className="font-medium mb-3">المنتجات:</p>
                <div className="space-y-2">
                  {order.order_items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        {item.products?.name} ({item.quantity})
                      </span>
                      <span className="font-medium">
                        {(item.quantity * item.price_at_sale).toFixed(2)} EGP
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
