/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import {
  useShipments,
  useCreateShipment,
  useUpdateShipment,
} from "@/hooks/useShipments";
import { useOrders } from "@/hooks/useOrders";

export default function ShipmentsPage() {
  const { data: shipments, isLoading } = useShipments();
  const { data: orders } = useOrders();
  const createShipment = useCreateShipment();
  const updateShipment = useUpdateShipment();

  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    courier_name: "",
    tracking_number: "",
    selected_orders: [] as number[],
  });

  const handleOrderSelect = (orderId: number) => {
    setFormData({
      ...formData,
      selected_orders: formData.selected_orders.includes(orderId)
        ? formData.selected_orders.filter((id) => id !== orderId)
        : [...formData.selected_orders, orderId],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.courier_name || formData.selected_orders.length === 0) {
      alert("ملء جميع الحقول");
      return;
    }

    setLoading(true);

    try {
      await createShipment.mutateAsync({
        courier_name: formData.courier_name,
        tracking_number: formData.tracking_number || null,
        order_ids: formData.selected_orders,
      });

      setFormData({
        courier_name: "",
        tracking_number: "",
        selected_orders: [],
      });
      setShowForm(false);
      alert("✅ تم إنشاء الشحنة!");
    } catch (err) {
      alert("❌ خطأ: " + (err instanceof Error ? err.message : "حدث خطأ"));
    } finally {
      setLoading(false);
    }
  };

  // Get pending orders only
  const pendingOrders =
    orders?.filter((o: any) => o.status === "pending") || [];

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">📦 الشحنات</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          {showForm ? "إلغاء" : "➕ إنشاء شحنة"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Courier Info */}
            <div>
              <h3 className="text-lg font-bold mb-4">معلومات الشحنة</h3>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="اسم شركة التوصيل"
                  value={formData.courier_name}
                  onChange={(e) =>
                    setFormData({ ...formData, courier_name: e.target.value })
                  }
                  required
                  className="border rounded px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="رقم التتبع (اختياري)"
                  value={formData.tracking_number}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tracking_number: e.target.value,
                    })
                  }
                  className="border rounded px-3 py-2"
                />
              </div>
            </div>

            {/* Select Orders */}
            <div>
              <h3 className="text-lg font-bold mb-4">اختر الطلبات</h3>
              {pendingOrders.length === 0 ? (
                <p className="text-gray-500">لا توجد طلبات بانتظار الشحن</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto border rounded p-4 bg-gray-50">
                  {pendingOrders.map((order: any) => (
                    <label
                      key={order.id}
                      className="flex items-center p-3 hover:bg-white rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.selected_orders.includes(order.id)}
                        onChange={() => handleOrderSelect(order.id)}
                        className="w-4 h-4 rounded mr-3"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{order.order_number}</p>
                        <p className="text-sm text-gray-600">
                          {order.customer_name} - {order.total_price} EGP
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              <p className="text-sm text-gray-600 mt-2">
                ✅ تم اختيار: {formData.selected_orders.length} طلب
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || formData.selected_orders.length === 0}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded disabled:opacity-50 w-full"
            >
              {loading ? "جاري الإنشاء..." : "إنشاء الشحنة"}
            </button>
          </form>
        </div>
      )}

      {/* Shipments List */}
      {isLoading ? (
        <p className="text-center">⏳ جاري التحميل...</p>
      ) : !shipments || shipments.length === 0 ? (
        <p className="text-center text-gray-500 py-8">لا توجد شحنات</p>
      ) : (
        <div className="space-y-4">
          {shipments.map((shipment: any) => (
            <div key={shipment.id} className="bg-white rounded-lg shadow p-6">
              <div className="grid grid-cols-5 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">رقم الشحنة</p>
                  <p className="font-bold">{shipment.shipment_number}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">الشركة</p>
                  <p className="font-medium">{shipment.courier_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">رقم التتبع</p>
                  <p className="text-sm">{shipment.tracking_number || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">عدد الطلبات</p>
                  <p className="font-bold">
                    {shipment.shipment_orders?.length || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">تاريخ الشحن</p>
                  <p className="text-sm">
                    {new Date(shipment.shipped_date).toLocaleDateString(
                      "ar-EG",
                    )}
                  </p>
                </div>
              </div>

              {/* Orders in Shipment */}
              {shipment.shipment_orders &&
                shipment.shipment_orders.length > 0 && (
                  <div className="mt-4 p-4 bg-gray-50 rounded">
                    <p className="font-medium mb-3">الطلبات المضمنة:</p>
                    <div className="space-y-2">
                      {shipment.shipment_orders.map((so: any) => (
                        <div
                          key={so.order_id}
                          className="flex justify-between text-sm"
                        >
                          <span className="font-medium">
                            {so.orders.order_number}
                          </span>
                          <span>{so.orders.customer_name}</span>
                          <span className="text-green-600">
                            {so.orders.total_price} EGP
                          </span>
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                            shipped
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
