/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useCallback } from "react";
import { useOrders, useCreateOrder, useUpdateOrder } from "@/hooks/useOrders";
import { useProducts } from "@/hooks/useProducts";
import { useAuth } from "@/hooks/useAuth";
import { Clock, CheckCircle2, Ban, ListTodo } from "lucide-react";
import {
  searchOrders,
  filterOrdersByStatus,
  filterOrdersByDate,
} from "@/lib/filters";
import { ORDER_STATUSES, STATUS_CONFIG } from "@/lib/orderStatus";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Plus, ShoppingCart, X, Truck } from "lucide-react";

const ORDER_SOURCES = ["facebook", "instagram", "whatsapp", "other"];

const SOURCE_CONFIG: Record<
  string,
  { label: string; emoji: string; className: string }
> = {
  facebook: {
    label: "فيسبوك",
    emoji: "📘",
    className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  instagram: {
    label: "إنستاجرام",
    emoji: "📸",
    className: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  },
  whatsapp: {
    label: "واتساب",
    emoji: "💬",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  other: {
    label: "أخرى",
    emoji: "🔗",
    className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  },
};

export default function OrdersPage() {
  const { data: orders, isLoading, refetch: refetchOrders } = useOrders();
  const { data: products } = useProducts();
  const createOrder = useCreateOrder();
  const updateOrder = useUpdateOrder();
  const { token } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_phone: "",
    customer_address: "",
    notes: "",
    shipped_with_courier: false,
    source: "",
    discount: "",
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
      if (res.ok) setVariants(await res.json());
    } catch {
      setVariants([]);
    }
  }, []);

  const handleAddItem = () => {
    if (!newItem.product_id || !newItem.size || !newItem.quantity) return;
    const qty = parseInt(newItem.quantity);
    const variant = variants.find((v) => v.size === newItem.size);
    if (!variant || variant.quantity < qty) {
      alert(`الكمية غير كافية للمقاس ${newItem.size}`);
      return;
    }
    const product = products?.find(
      (p: any) => p.id === parseInt(newItem.product_id),
    );
    if (!product) return;
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

  const subtotal = items.reduce((s, i) => s + i.quantity * i.price_at_sale, 0);
  const discountAmount = parseFloat(formData.discount) || 0;
  const totalPrice = Math.max(0, subtotal - discountAmount);

  const handleSubmit = async () => {
    if (!items.length || !token) return;
    setLoading(true);
    try {
      await createOrder.mutateAsync({
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        customer_address: formData.customer_address,
        notes: formData.notes,
        shipped_with_courier: formData.shipped_with_courier,
        source: formData.source || null,
        discount: discountAmount || 0,
        items,
        token,
      });
      setFormData({
        customer_name: "",
        customer_phone: "",
        customer_address: "",
        notes: "",
        shipped_with_courier: false,
        source: "",
        discount: "",
      });
      setItems([]);
      setSheetOpen(false);
    } catch (err) {
      alert("❌ " + (err instanceof Error ? err.message : "حدث خطأ"));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      await updateOrder.mutateAsync({ id: orderId, status: newStatus });
    } catch {
      alert("❌ خطأ في تحديث الحالة");
    }
  };

  const availableSizes = variants
    .filter((v) => v.quantity > 0)
    .map((v) => v.size);

  let filteredOrders = orders || [];
  filteredOrders = searchOrders(filteredOrders, searchQuery);
  filteredOrders = filterOrdersByStatus(filteredOrders, filterStatus);
  filteredOrders = filterOrdersByDate(
    filteredOrders,
    filterStartDate,
    filterEndDate,
  );

  const orderStats = {
    total: orders?.length || 0,

    pending: orders?.filter((o: any) => o.status === "pending").length || 0,

    processing:
      orders?.filter(
        (o: any) => o.status === "prepared" || o.status === "shipped",
      ).length || 0,

    completed: orders?.filter((o: any) => o.status === "delivered").length || 0,

    cancelled: orders?.filter((o: any) => o.status === "cancelled").length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            الطلبات
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            {filteredOrders.length} طلب
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setSheetOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">طلب جديد</span>
        </Button>
      </div>

      {/* Search & Filters */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
            {" "}
            <div className="md:col-span-2">
              {" "}
              <Input
                placeholder="🔍 بحث..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 text-sm"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-300 text-sm">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem
                  value="all"
                  className="text-zinc-200 focus:bg-zinc-700"
                >
                  الكل
                </SelectItem>
                {ORDER_STATUSES.map((s) => (
                  <SelectItem
                    key={s}
                    value={s}
                    className="text-zinc-200 focus:bg-zinc-700"
                  >
                    {STATUS_CONFIG[s]?.label || s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-zinc-300 text-sm"
            />
            <Input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-zinc-300 text-sm"
            />
            <Button
              variant="outline"
              size="sm"
              className="border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white text-sm"
              onClick={() => {
                setSearchQuery("");
                setFilterStatus("all");
                setFilterStartDate("");
                setFilterEndDate("");
              }}
            >
              إعادة تعيين
            </Button>
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500">إجمالي الطلبات</p>
            <p className="text-2xl font-bold text-white">{orderStats.total}</p>
            <ListTodo className="w-5 h-5 text-indigo-400" />
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500">قيد الانتظار</p>
            <p className="text-2xl font-bold text-yellow-400">
              {orderStats.pending}
            </p>
            <Clock className="w-5 h-5 text-yellow-400" />
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500">معلقة</p>
            <p className="text-2xl font-bold text-orange-400">
              {orderStats.processing}
            </p>
            <Clock className="w-5 h-5 text-orange-400" />
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500">مكتملة</p>
            <p className="text-2xl font-bold text-emerald-400">
              {orderStats.completed}
            </p>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500">ملغية</p>
            <p className="text-2xl font-bold text-red-400">
              {orderStats.cancelled}
            </p>
            <Ban className="w-5 h-5 text-red-400" />
          </CardContent>
        </Card>
      </div>
      {/* Orders List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 bg-zinc-800 rounded-xl" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-zinc-600">
          <ShoppingCart className="w-10 h-10 mb-2 opacity-40" />
          <p className="text-sm">لا توجد طلبات مطابقة</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order: any) => (
            <Card
              key={order.id}
              className={`bg-zinc-900 border-zinc-800 overflow-hidden ${
                order.shipped_with_courier
                  ? "border-l-2 border-l-violet-500"
                  : ""
              }`}
            >
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
                  <div>
                    <p className="text-[10px] text-zinc-600 mb-0.5">
                      رقم الطلب
                    </p>
                    <p className="text-sm font-mono font-semibold text-zinc-200">
                      {order.order_number}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-600 mb-0.5">العميل</p>
                    <p className="text-sm font-medium text-white">
                      {order.customer_name}
                    </p>
                    <p className="text-[10px] text-zinc-600">
                      {order.customer_phone}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-600 mb-0.5">الإجمالي</p>
                    <p className="text-sm font-bold text-emerald-400">
                      {order.total_price} EGP
                    </p>
                    {order.discount > 0 && (
                      <p className="text-[10px] text-red-400">
                        خصم: -{order.discount} EGP
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-600 mb-1">الحالة</p>
                    <Select
                      value={order.status}
                      onValueChange={(v) => handleStatusChange(order.id, v)}
                    >
                      <SelectTrigger
                        className={`h-7 text-xs border px-2 w-full ${
                          STATUS_CONFIG[order.status]?.className || ""
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
                  <div>
                    <p className="text-[10px] text-zinc-600 mb-0.5">التاريخ</p>
                    <p className="text-xs text-zinc-400">
                      {new Date(order.created_at).toLocaleDateString("ar-EG")}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {order.shipped_with_courier && (
                        <Badge
                          variant="outline"
                          className="text-[10px] border-violet-500/30 text-violet-400 gap-1"
                        >
                          <Truck className="w-2.5 h-2.5" /> شحن
                        </Badge>
                      )}
                      {order.source && SOURCE_CONFIG[order.source] && (
                        <Badge
                          variant="outline"
                          className={`text-[10px] gap-1 ${SOURCE_CONFIG[order.source].className}`}
                        >
                          {SOURCE_CONFIG[order.source].emoji}{" "}
                          {SOURCE_CONFIG[order.source].label}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {order.order_items?.length > 0 && (
                  <div className="bg-zinc-800/50 rounded-lg p-3 space-y-1.5">
                    {order.order_items.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex justify-between text-xs text-zinc-400"
                      >
                        <span>
                          {item.products?.name} · {item.size} · x{item.quantity}
                        </span>
                        <span className="text-zinc-300 font-medium">
                          {(item.quantity * item.price_at_sale).toFixed(0)} EGP
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New Order Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="bottom"
          className="bg-zinc-900 border-zinc-800 rounded-2xl max-h-[95vh] overflow-y-auto mx-3 mb-3 px-4 pb-6"
        >
          <SheetHeader className="mb-5">
            <SheetTitle className="text-white text-right">طلب جديد</SheetTitle>
          </SheetHeader>

          <div className="space-y-5">
            {/* Customer Info */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                بيانات العميل
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-zinc-400 text-xs">الاسم</Label>
                  <Input
                    placeholder="اسم العميل"
                    value={formData.customer_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        customer_name: e.target.value,
                      })
                    }
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-zinc-400 text-xs">الهاتف</Label>
                  <Input
                    type="tel"
                    placeholder="01xxxxxxxxx"
                    value={formData.customer_phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        customer_phone: e.target.value,
                      })
                    }
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
                  />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-zinc-400 text-xs">العنوان</Label>
                  <Input
                    placeholder="العنوان"
                    value={formData.customer_address}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        customer_address: e.target.value,
                      })
                    }
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
                  />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-zinc-400 text-xs">ملاحظات</Label>
                  <Input
                    placeholder="ملاحظات..."
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
                  />
                </div>
              </div>

              {/* Source & Discount row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-zinc-400 text-xs">مصدر الطلب</Label>
                  <Select
                    value={formData.source}
                    onValueChange={(v) =>
                      setFormData({ ...formData, source: v })
                    }
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-300 text-sm">
                      <SelectValue placeholder="اختر المصدر" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      {ORDER_SOURCES.map((s) => (
                        <SelectItem
                          key={s}
                          value={s}
                          className="text-zinc-200 focus:bg-zinc-700"
                        >
                          {SOURCE_CONFIG[s].emoji} {SOURCE_CONFIG[s].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-zinc-400 text-xs">خصم (EGP)</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.discount}
                    onChange={(e) =>
                      setFormData({ ...formData, discount: e.target.value })
                    }
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="courier"
                  checked={formData.shipped_with_courier}
                  onCheckedChange={(v) =>
                    setFormData({ ...formData, shipped_with_courier: !!v })
                  }
                  className="border-zinc-600 data-[state=checked]:bg-indigo-600"
                />
                <Label
                  htmlFor="courier"
                  className="text-zinc-400 text-sm cursor-pointer"
                >
                  شحن عبر شركة توصيل
                </Label>
              </div>
            </div>

            {/* Add Items */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                المنتجات
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {" "}
                <Select
                  value={newItem.product_id}
                  onValueChange={handleProductSelect}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-300 text-sm">
                    <SelectValue placeholder="اختر المنتج" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {products?.map((p: any) => (
                      <SelectItem
                        key={p.id}
                        value={String(p.id)}
                        className="text-zinc-200 focus:bg-zinc-700"
                      >
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={newItem.size}
                  onValueChange={(v) => setNewItem({ ...newItem, size: v })}
                  disabled={!newItem.product_id}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-300 text-sm disabled:opacity-40">
                    <SelectValue placeholder="المقاس" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {availableSizes.map((size) => {
                      const v = variants.find((v) => v.size === size);
                      return (
                        <SelectItem
                          key={size}
                          value={size}
                          className="text-zinc-200 focus:bg-zinc-700"
                        >
                          {size} ({v?.quantity})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <div className="flex gap-2 col-span-2">
                  <Input
                    type="number"
                    min="1"
                    placeholder="الكمية"
                    value={newItem.quantity}
                    onChange={(e) =>
                      setNewItem({ ...newItem, quantity: e.target.value })
                    }
                    disabled={!newItem.size}
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 disabled:opacity-40 flex-1"
                  />
                  <Button
                    onClick={handleAddItem}
                    variant="outline"
                    className="border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 shrink-0"
                  >
                    إضافة
                  </Button>
                </div>
              </div>

              {/* Items Table */}
              {items.length > 0 && (
                <div className="bg-zinc-800/50 rounded-lg overflow-hidden">
                  <div className="divide-y divide-zinc-700/50">
                    {items.map((item, idx) => {
                      const product = products?.find(
                        (p: any) => p.id === item.product_id,
                      );
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between px-3 py-2.5 text-sm"
                        >
                          <div className="text-zinc-300">
                            <span className="font-medium">{product?.name}</span>
                            <span className="text-zinc-500 mx-1">·</span>
                            <span className="text-zinc-500">
                              {item.size} · x{item.quantity}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-emerald-400 font-medium text-xs">
                              {(item.quantity * item.price_at_sale).toFixed(0)}{" "}
                              EGP
                            </span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-zinc-600 hover:text-red-400"
                              onClick={() =>
                                setItems(items.filter((_, i) => i !== idx))
                              }
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Subtotal / Discount / Total */}
                  <div className="border-t border-zinc-700/50 px-3 py-2 space-y-1">
                    <div className="flex justify-between text-xs text-zinc-500">
                      <span>المجموع الفرعي</span>
                      <span>{subtotal.toFixed(0)} EGP</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-xs text-red-400">
                        <span>الخصم</span>
                        <span>-{discountAmount.toFixed(0)} EGP</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold text-emerald-400 pt-1 border-t border-zinc-700/50">
                      <span>الإجمالي</span>
                      <span>{totalPrice.toFixed(0)} EGP</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading || items.length === 0}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40"
            >
              {loading ? "جاري الإنشاء..." : "إنشاء الطلب"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
