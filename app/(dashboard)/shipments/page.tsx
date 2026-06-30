/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState } from "react";
import { useShipments, useCreateShipment } from "@/hooks/useShipments";
import { useOrders, useUpdateOrder } from "@/hooks/useOrders";
import { ORDER_STATUSES, STATUS_CONFIG } from "@/lib/orderStatus";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Plus,
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  Search,
} from "lucide-react";

const fmt = (n: number) =>
  new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 0 }).format(n);

export default function ShipmentsPage() {
  const { data: shipments, isLoading } = useShipments();
  const { data: orders } = useOrders();
  const createShipment = useCreateShipment();
  const updateOrder = useUpdateOrder();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderSearch, setOrderSearch] = useState("");
  const [formData, setFormData] = useState({
    courier_name: "",
    tracking_number: "",
    selected_orders: [] as number[],
  });

  const toggleOrder = (orderId: number) => {
    setFormData((prev) => ({
      ...prev,
      selected_orders: prev.selected_orders.includes(orderId)
        ? prev.selected_orders.filter((id) => id !== orderId)
        : [...prev.selected_orders, orderId],
    }));
  };

  const pendingOrders =
    orders?.filter(
      (o: any) => o.status === "pending" || o.status === "prepared",
    ) || [];

  const readyForCourier = pendingOrders.filter(
    (o: any) => o.shipped_with_courier,
  );

  const visiblePendingOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    if (!q) return pendingOrders;
    return pendingOrders.filter(
      (o: any) =>
        o.order_number?.toLowerCase().includes(q) ||
        o.customer_name?.toLowerCase().includes(q),
    );
  }, [pendingOrders, orderSearch]);

  // فتح الشيت مع تحديد الطلبات المعلّمة "شحن عبر شركة توصيل" تلقائياً
  const openNewShipmentSheet = () => {
    const preselected = pendingOrders
      .filter((o: any) => o.shipped_with_courier)
      .map((o: any) => o.id);
    setFormData((prev) => ({ ...prev, selected_orders: preselected }));
    setOrderSearch("");
    setSheetOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.courier_name || !formData.selected_orders.length) return;
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
      setSheetOpen(false);
    } catch (err) {
      alert("❌ " + (err instanceof Error ? err.message : "حدث خطأ"));
    } finally {
      setLoading(false);
    }
  };

  // ده اللي بيخلي الحالة تتزامن بين الصفحتين: تغيير الحالة هنا
  // بيعمل update على order نفسه في جدول orders، فـ صفحة الطلبات
  // هتشوف نفس التغيير فورًا (والعكس صحيح) لأن الاتنين بيقروا من
  // نفس الـ source (جدول orders) وبيعملوا invalidate لنفس الـ query.
  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      await updateOrder.mutateAsync({ id: orderId, status: newStatus });
    } catch {
      alert("❌ خطأ في تحديث الحالة");
    }
  };

  // مهم: احنا عايزين الشحنات اللي اتعملها assign بس
  const assignedOrders =
    shipments?.flatMap(
      (shipment: any) =>
        shipment.shipment_orders?.map((so: any) => so.orders) || [],
    ) || [];

  const assignedPending = assignedOrders.filter(
    (o: any) => o.status === "pending" || o.status === "prepared",
  ).length;

  const assignedShipped = assignedOrders.filter(
    (o: any) => o.status === "shipped",
  );

  const assignedDelivered = assignedOrders.filter(
    (o: any) => o.status === "delivered",
  ).length;

  const assignedCancelled = assignedOrders.filter(
    (o: any) => o.status === "cancelled",
  ).length;

  const shippedValue = assignedShipped.reduce(
    (sum: number, order: any) => sum + (order?.total_price || 0),
    0,
  );

  const totalValue = (shipment: any) =>
    shipment.shipment_orders?.reduce(
      (s: number, so: any) => s + (so.orders?.total_price || 0),
      0,
    ) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            الشحنات
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            {shipments?.length || 0} شحنة · {pendingOrders.length} طلب جاهز
            للشحن
          </p>
        </div>
        <Button
          size="sm"
          onClick={openNewShipmentSheet}
          className="bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">شحنة جديدة</span>
        </Button>
      </div>

      {/* Ready for courier — distinct callout */}
      {readyForCourier.length > 0 && (
        <Card className="bg-gradient-to-br from-violet-950/30 via-zinc-900 to-zinc-900 border-violet-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-violet-300 flex items-center gap-1.5">
                <Truck className="w-4 h-4" />
                طلبات جاهزة للشحن
                <Badge
                  variant="outline"
                  className="border-violet-500/30 text-violet-300 text-[10px] tabular-nums"
                >
                  {readyForCourier.length}
                </Badge>
              </p>
              <Button
                size="sm"
                variant="outline"
                className="border-violet-500/30 text-violet-300 hover:bg-violet-500/10 text-xs h-7"
                onClick={openNewShipmentSheet}
              >
                عمل شحنة بيها
              </Button>
            </div>
            <div className="space-y-2">
              {readyForCourier.map((order: any) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between gap-2 bg-zinc-800/50 rounded-lg px-3 py-2.5 text-xs"
                >
                  <span className="font-mono text-zinc-400 shrink-0">
                    {order.order_number}
                  </span>
                  <span className="text-zinc-300 truncate flex-1">
                    {order.customer_name}
                  </span>
                  <span className="text-emerald-400 font-medium shrink-0 tabular-nums">
                    {fmt(order.total_price)} EGP
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-zinc-500">إجمالي الشحنات</p>
                <p className="text-2xl font-bold text-white tabular-nums">
                  {shipments?.length || 0}
                </p>
              </div>
              <Package className="w-5 h-5 text-indigo-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-zinc-500">معلقة</p>
                <p className="text-2xl font-bold text-yellow-400 tabular-nums">
                  {assignedPending}
                </p>
              </div>
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex justify-between">
              <div>
                <p className="text-xs text-zinc-500">عند شركة الشحن</p>
                <p className="text-2xl font-bold text-blue-400 tabular-nums">
                  {assignedShipped.length}
                </p>
              </div>
              <Truck className="w-5 h-5 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex justify-between">
              <div>
                <p className="text-xs text-zinc-500">مكتمل</p>
                <p className="text-2xl font-bold text-emerald-400 tabular-nums">
                  {assignedDelivered}
                </p>
              </div>
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex justify-between">
              <div>
                <p className="text-xs text-zinc-500">ملغي</p>
                <p className="text-2xl font-bold text-red-400 tabular-nums">
                  {assignedCancelled}
                </p>
              </div>
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800 col-span-2 lg:col-span-1">
          <CardContent className="p-4">
            <div className="flex justify-between">
              <div>
                <p className="text-xs text-zinc-500">قيمة الشحنات</p>
                <p className="text-xl font-bold text-violet-400 tabular-nums">
                  {fmt(shippedValue)}
                </p>
                <p className="text-[10px] text-zinc-600">EGP</p>
              </div>
              <DollarSign className="w-5 h-5 text-violet-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shipments List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36 bg-zinc-800 rounded-xl" />
          ))}
        </div>
      ) : !shipments?.length ? (
        <div className="flex flex-col items-center justify-center h-56 text-zinc-600 gap-1.5">
          <Package className="w-10 h-10 opacity-30" />
          <p className="text-sm text-zinc-500">لا توجد شحنات بعد</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-1 text-indigo-400 hover:text-indigo-300"
            onClick={openNewShipmentSheet}
          >
            أنشئ أول شحنة
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {shipments.map((shipment: any) => (
            <Card
              key={shipment.id}
              className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              <CardContent className="p-4">
                {/* Shipment Meta */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div>
                    <p className="text-[10px] text-zinc-600 mb-0.5">
                      رقم الشحنة
                    </p>
                    <p className="text-sm font-mono font-semibold text-zinc-200">
                      {shipment.shipment_number}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-600 mb-0.5">
                      شركة التوصيل
                    </p>
                    <div className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-violet-400" />
                      <p className="text-sm font-medium text-white truncate">
                        {shipment.courier_name}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-600 mb-0.5">
                      رقم التتبع
                    </p>
                    <p className="text-sm text-zinc-400 font-mono">
                      {shipment.tracking_number || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-600 mb-0.5">
                      تاريخ الشحن
                    </p>
                    <p className="text-sm text-zinc-400">
                      {new Date(shipment.shipped_date).toLocaleDateString(
                        "ar-EG",
                      )}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 mb-3">
                  <Badge
                    variant="outline"
                    className="text-[10px] border-zinc-700 text-zinc-500 gap-1"
                  >
                    <Package className="w-2.5 h-2.5" />
                    {shipment.shipment_orders?.length || 0} طلبات
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-[10px] border-emerald-500/20 text-emerald-400 tabular-nums"
                  >
                    {fmt(totalValue(shipment))} EGP
                  </Badge>
                </div>

                {/* Orders — الحالة هنا حقيقية وقابلة للتغيير،
                    ومتزامنة 100% مع صفحة الطلبات */}
                {shipment.shipment_orders?.length > 0 && (
                  <div className="bg-zinc-800/50 rounded-lg divide-y divide-zinc-700/50">
                    {shipment.shipment_orders.map((so: any) => (
                      <div
                        key={so.order_id}
                        className="flex items-center justify-between gap-2 px-3 py-2.5 text-xs"
                      >
                        <span className="font-mono text-zinc-400 shrink-0">
                          {so.orders.order_number}
                        </span>
                        <span className="text-zinc-300 truncate flex-1">
                          {so.orders.customer_name}
                        </span>
                        <span className="text-emerald-400 font-medium shrink-0 tabular-nums">
                          {fmt(so.orders.total_price)} EGP
                        </span>
                        <Select
                          value={so.orders.status}
                          onValueChange={(v) =>
                            handleStatusChange(so.orders.id, v)
                          }
                        >
                          <SelectTrigger
                            className={`h-6 text-[10px] border px-2 w-[110px] shrink-0 ${
                              STATUS_CONFIG[so.orders.status]?.className || ""
                            } bg-transparent`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-800 border-zinc-700">
                            {ORDER_STATUSES.map((s) => (
                              <SelectItem
                                key={s}
                                value={s}
                                className="text-zinc-200 text-xs focus:bg-zinc-700"
                              >
                                {STATUS_CONFIG[s]?.label || s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New Shipment Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="bottom"
          className="bg-zinc-900 border-zinc-800 rounded-2xl max-h-[95vh] overflow-y-auto mx-3 mb-3 px-4 pb-6"
        >
          <SheetHeader className="mb-5">
            <SheetTitle className="text-white text-right">
              شحنة جديدة
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-5">
            {/* Courier Info */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                معلومات الشحنة
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <Label className="text-zinc-400 text-xs">
                    اسم شركة التوصيل
                  </Label>
                  <Input
                    placeholder="مثال: Bosta، J&T"
                    value={formData.courier_name}
                    onChange={(e) =>
                      setFormData({ ...formData, courier_name: e.target.value })
                    }
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
                  />
                </div>
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <Label className="text-zinc-400 text-xs">
                    رقم التتبع (اختياري)
                  </Label>
                  <Input
                    placeholder="TRACK-XXXXX"
                    value={formData.tracking_number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tracking_number: e.target.value,
                      })
                    }
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
                  />
                </div>
              </div>
            </div>

            {/* Select Orders */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  اختر الطلبات
                </p>
                <Badge
                  variant="outline"
                  className="text-[10px] border-indigo-500/20 text-indigo-400 tabular-nums"
                >
                  {formData.selected_orders.length} محدد
                </Badge>
              </div>

              {pendingOrders.length === 0 ? (
                <div className="bg-zinc-800/50 rounded-lg p-6 text-center text-zinc-600 text-sm">
                  لا توجد طلبات جاهزة للشحن
                </div>
              ) : (
                <>
                  {pendingOrders.length > 5 && (
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
                      <Input
                        placeholder="بحث برقم الطلب أو اسم العميل..."
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 text-sm pr-9 h-9"
                      />
                    </div>
                  )}
                  <div className="bg-zinc-800/50 rounded-lg divide-y divide-zinc-700/50 max-h-64 overflow-y-auto">
                    {visiblePendingOrders.length === 0 ? (
                      <p className="text-center text-zinc-600 text-xs py-6">
                        لا توجد طلبات مطابقة للبحث
                      </p>
                    ) : (
                      visiblePendingOrders.map((order: any) => (
                        <label
                          key={order.id}
                          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-zinc-800 transition-colors"
                        >
                          <Checkbox
                            checked={formData.selected_orders.includes(
                              order.id,
                            )}
                            onCheckedChange={() => toggleOrder(order.id)}
                            className="border-zinc-600 data-[state=checked]:bg-indigo-600 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-medium text-zinc-200 font-mono">
                                {order.order_number}
                              </p>
                              {order.shipped_with_courier && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] border-violet-500/30 text-violet-400 px-1 py-0"
                                >
                                  محدد للشحن
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-zinc-500 truncate">
                              {order.customer_name}
                            </p>
                          </div>
                          <span className="text-xs font-semibold text-emerald-400 shrink-0 tabular-nums">
                            {fmt(order.total_price)} EGP
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>

            <Button
              onClick={handleSubmit}
              disabled={
                loading ||
                !formData.courier_name ||
                !formData.selected_orders.length
              }
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40"
            >
              {loading
                ? "جاري الإنشاء..."
                : `إنشاء الشحنة (${formData.selected_orders.length} طلبات)`}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
