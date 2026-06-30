/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useCallback } from "react";
import { useOrders, useCreateOrder, useUpdateOrder } from "@/hooks/useOrders";
import { useProducts } from "@/hooks/useProducts";
import { useShippingCities } from "@/hooks/useShippingCities";
import { useAuth } from "@/hooks/useAuth";
import {
  Clock,
  CheckCircle2,
  Ban,
  ListTodo,
  Search,
  RotateCcw,
} from "lucide-react";
import {
  searchOrders,
  filterOrdersByStatus,
  filterOrdersByDate,
} from "@/lib/filters";
import { ORDER_STATUSES, STATUS_CONFIG } from "@/lib/orderStatus";
import { Card, CardContent } from "@/components/ui/card";
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
import { Plus, ShoppingCart, X, Truck, Package2, Link2 } from "lucide-react";
import { FaFacebook, FaInstagram, FaWhatsapp } from "react-icons/fa";

const ORDER_SOURCES = [
  "facebook",
  "instagram",
  "whatsapp",
  "jumia",
  "other",
] as const;

const SOURCE_CONFIG = {
  facebook: {
    label: "فيسبوك",
    icon: FaFacebook,
    className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  instagram: {
    label: "إنستاجرام",
    icon: FaInstagram,
    className: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  },
  whatsapp: {
    label: "واتساب",
    icon: FaWhatsapp,
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  jumia: {
    label: "جوميا",
    icon: ShoppingCart,
    className: "bg-orange-500/10 text-orange-300 border-orange-500/20",
  },
  other: {
    label: "أخرى",
    icon: Link2,
    className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  },
} as const;

// استخراج نوع (Type) به صورت خودکار
type SourceKey = keyof typeof SOURCE_CONFIG;
const fmt = (n: number) =>
  new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 0 }).format(n);

const formatFullDate = (value?: string) =>
  value
    ? new Date(value).toLocaleString("ar-EG", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

const printInvoice = (order: any) => {
  if (typeof window === "undefined") return;

  const itemsHtml = (order.order_items || [])
    .map(
      (item: any) => `
        <tr>
          <td>${String(item.products?.name || "-")}</td>
          <td class="text-center">${String(item.size || "-")}</td>
          <td class="text-center">${String(item.quantity || 0)}</td>
          <td class="text-right">${fmt(item.price_at_sale || 0)} EGP</td>
          <td class="text-right">${fmt(
            (item.quantity || 0) * (item.price_at_sale || 0),
          )} EGP</td>
        </tr>
      `,
    )
    .join("");

  const shippingFee = order.shipping_city?.shipping_fee || 0;
  const shippingCityName = order.shipping_city?.city_name || "غير محدد";
  const discount = order.discount || 0;
  const subtotal = (order.total_price || 0) + discount;

  const html = `
    <html lang="ar" dir="rtl">
      <head>
        <meta charset="utf-8" />
        <title>فاتورة BASIK - ${String(order.order_number)}</title>
        <style>
          body { margin: 0; padding: 0; font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; background: #f7f7f7; color: #111; }
          .page { max-width: 900px; margin: 0 auto; padding: 32px; background: #fff; }
          .brand { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 24px; }
          .brand-logo { font-size: 42px; font-weight: 900; letter-spacing: -2px; color: #111; }
          .brand-subtitle { text-transform: uppercase; font-size: 10px; color: #555; margin-top: 4px; }
          .invoice-meta { text-align: right; }
          .invoice-meta h1 { margin: 0; font-size: 24px; }
          .invoice-meta p { margin: 4px 0; color: #555; }
          .customer-info { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 26px; }
          .customer-box { padding: 18px; border: 1px solid #e5e7eb; border-radius: 16px; background: #fafafa; }
          .customer-box h2 { margin: 0 0 8px; font-size: 14px; color: #111; }
          .customer-box p { margin: 6px 0; font-size: 13px; color: #444; }
          .table-wrapper { overflow-x: auto; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { padding: 14px 12px; border: 1px solid #e5e7eb; }
          th { background: #111; color: #fff; font-size: 13px; text-align: center; }
          td { font-size: 13px; color: #333; }
          td.text-right { text-align: right; }
          td.text-center { text-align: center; }
          .summary { display: grid; grid-template-columns: 1fr auto; gap: 16px; align-items: start; }
          .summary-details { padding: 18px; border: 1px solid #e5e7eb; border-radius: 16px; background: #fafafa; }
          .summary-list { width: 320px; border-collapse: collapse; }
          .summary-list td { padding: 12px; border: none; }
          .summary-list tr + tr td { border-top: 1px solid #e5e7eb; }
          .summary-list .label { color: #555; }
          .summary-list .value { text-align: right; font-weight: 700; }
          .summary-list .total { font-size: 17px; color: #111; }
          .footer { margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 16px; display: flex; justify-content: space-between; align-items: center; color: #555; font-size: 12px; }
          .footer strong { color: #111; }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="brand">
            <div>
              <div class="brand-logo">BASIK</div>
              <div class="brand-subtitle">Men's Wear</div>
            </div>
            <div class="invoice-meta">
              <h1>فاتورة</h1>
              <p>رقم الطلب: ${String(order.order_number || "-")}</p>
              <p>التاريخ: ${formatFullDate(order.created_at)}</p>
            </div>
          </div>

          <div class="customer-info">
            <div class="customer-box">
              <h2>بيانات العميل</h2>
              <p>الاسم: ${String(order.customer_name || "-")}</p>
              <p>الموبيل: ${String(order.customer_phone || "-")}</p>
              <p>العنوان: ${String(order.customer_address || "-")}</p>
            </div>
            <div class="customer-box">
              <h2>تفاصيل الطلب</h2>
              <p>مصدر الطلب: ${String(
                SOURCE_CONFIG[order.source as SourceKey]?.label || "-",
              )}</p>
              <p>مدينة التوصيل: ${shippingCityName}</p>
              <p>رسوم التوصيل: ${fmt(shippingFee)} EGP</p>
              <p>ملاحظات: ${String(order.notes || "-")}</p>
            </div>
          </div>

          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>المنتج</th>
                  <th>المقاس</th>
                  <th>الكمية</th>
                  <th>سعر الوحدة</th>
                  <th>الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>

          <div class="summary">
            <table class="summary-list">
              <tr>
                <td class="label">إجمالي المنتجات</td>
                <td class="value">${fmt(subtotal)} EGP</td>
              </tr>
              ${
                discount > 0
                  ? `
                <tr>
                  <td class="label">الخصم</td>
                  <td class="value">-${fmt(discount)} EGP</td>
                </tr>
              `
                  : ""
              }
              <tr>
                <td class="label">رسوم التوصيل</td>
                <td class="value">${fmt(shippingFee)} EGP</td>
              </tr>
              <tr>
                <td class="label total">الإجمالي النهائي</td>
                <td class="value total">${fmt((order.total_price || 0) + shippingFee)} EGP</td>
              </tr>
            </table>
          </div>

          <div class="footer">
            <div>شكراً لتعاملكم مع BASIK</div>
            <div><strong>BASIK Men's Wear</strong></div>
          </div>
        </div>
      </body>
    </html>
  `;

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};

export default function OrdersPage() {
  const { data: orders, isLoading } = useOrders();
  const { data: products } = useProducts();
  const createOrder = useCreateOrder();
  const updateOrder = useUpdateOrder();
  const { data: shippingCities } = useShippingCities();
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
    shipping_city_id: "",
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
    const qty = parseInt(newItem.quantity, 10);
    if (!Number.isInteger(qty) || qty < 1) {
      alert("الكمية يجب أن تكون 1 أو أكثر");
      return;
    }
    const variant = variants.find((v) => v.size === newItem.size);
    if (!variant || variant.quantity < qty) {
      alert(`الكمية غير كافية للمقاس ${newItem.size}`);
      return;
    }
    const product = products?.find(
      (p: any) => p.id === parseInt(newItem.product_id, 10),
    );
    if (!product) return;
    setItems([
      ...items,
      {
        product_id: parseInt(newItem.product_id, 10),
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
        shipping_city_id:
          formData.shipping_city_id !== ""
            ? Number(formData.shipping_city_id)
            : null,
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
        shipping_city_id: "",
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

  const hasActiveFilters =
    searchQuery || filterStatus !== "all" || filterStartDate || filterEndDate;

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

  const STAT_CARDS = [
    {
      key: "all",
      label: "إجمالي الطلبات",
      value: orderStats.total,
      icon: ListTodo,
      color: "text-indigo-400",
    },
    {
      key: "pending",
      label: "قيد الانتظار",
      value: orderStats.pending,
      icon: Clock,
      color: "text-yellow-400",
    },
    {
      key: "processing",
      label: "معلقة",
      value: orderStats.processing,
      icon: Clock,
      color: "text-orange-400",
    },
    {
      key: "delivered",
      label: "مكتملة",
      value: orderStats.completed,
      icon: CheckCircle2,
      color: "text-emerald-400",
    },
    {
      key: "cancelled",
      label: "ملغية",
      value: orderStats.cancelled,
      icon: Ban,
      color: "text-red-400",
    },
  ];

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
            {hasActiveFilters && orders?.length ? ` من ${orders.length}` : ""}
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

      {/* Stat Cards — tappable status filters */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {STAT_CARDS.map((s) => {
          const Icon = s.icon;
          const active =
            s.key === "all" ? filterStatus === "all" : filterStatus === s.key;
          return (
            <Card
              key={s.key}
              role="button"
              onClick={() => setFilterStatus(active ? "all" : s.key)}
              className={`bg-zinc-900 cursor-pointer transition-colors ${
                active && s.key !== "all"
                  ? "border-indigo-500/50 ring-1 ring-indigo-500/30"
                  : "border-zinc-800 hover:border-zinc-700"
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-zinc-500">{s.label}</p>
                    <p className={`text-2xl font-bold tabular-nums ${s.color}`}>
                      {s.value}
                    </p>
                  </div>
                  <Icon className={`w-5 h-5 ${s.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search & Filters */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
            <div className="md:col-span-2 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <Input
                placeholder="بحث برقم الطلب، اسم العميل، أو الهاتف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 text-sm pr-9"
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
              disabled={!hasActiveFilters}
              className="border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white text-sm gap-1.5 disabled:opacity-30"
              onClick={() => {
                setSearchQuery("");
                setFilterStatus("all");
                setFilterStartDate("");
                setFilterEndDate("");
              }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              إعادة تعيين
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 bg-zinc-800 rounded-xl" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-zinc-600 gap-1.5">
          <ShoppingCart className="w-10 h-10 opacity-30" />
          <p className="text-sm text-zinc-500">
            {hasActiveFilters
              ? "لا توجد طلبات مطابقة للفلاتر"
              : "لا توجد طلبات بعد"}
          </p>
          {hasActiveFilters && (
            <button
              onClick={() => {
                setSearchQuery("");
                setFilterStatus("all");
                setFilterStartDate("");
                setFilterEndDate("");
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              مسح الفلاتر
            </button>
          )}
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
                    <p className="text-sm font-medium text-white truncate">
                      {order.customer_name}
                    </p>
                    <p className="text-[10px] text-zinc-600" dir="ltr">
                      {order.customer_phone}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-600 mb-0.5">الإجمالي</p>
                    <p className="text-sm font-bold text-emerald-400 tabular-nums">
                      {fmt(order.total_price)} EGP
                    </p>
                    {order.discount > 0 && (
                      <p className="text-[10px] text-red-400 tabular-nums">
                        خصم: -{fmt(order.discount)} EGP
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
                      {order.shipping_city && (
                        <Badge
                          variant="outline"
                          className="text-[10px] border-amber-500/30 text-amber-300 gap-1"
                        >
                          {order.shipping_city.city_name} ·{" "}
                          {fmt(order.shipping_city.shipping_fee)} EGP
                        </Badge>
                      )}
                      {order.source &&
                        SOURCE_CONFIG[order.source as SourceKey] && (
                          <Badge
                            variant="outline"
                            className={`text-[10px] gap-1 ${
                              SOURCE_CONFIG[order.source as SourceKey].className
                            }`}
                          >
                            {SOURCE_CONFIG[order.source as SourceKey].label}
                          </Badge>
                        )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 mb-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => printInvoice(order)}
                    className="text-[11px] px-3 py-2"
                  >
                    طباعة الفاتورة
                  </Button>
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
                        <span className="text-zinc-300 font-medium tabular-nums">
                          {fmt(item.quantity * item.price_at_sale)} EGP
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
                  <p className="text-[10px] text-zinc-600">
                    لو الرقم موجود قبل كده، الطلب هيتربط تلقائياً بنفس العميل
                  </p>
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

              {/* Source — visual chip picker instead of plain dropdown */}
              <div className="space-y-1.5">
                <Label className="text-zinc-400 text-xs">مصدر الطلب</Label>
                <div className="grid grid-cols-4 gap-2">
                  {ORDER_SOURCES.map((s) => {
                    const active = formData.source === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            source: active ? "" : s,
                          })
                        }
                        className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-medium transition-colors ${
                          active
                            ? "border-indigo-500 bg-indigo-500/10 text-indigo-300"
                            : "border-zinc-700 bg-zinc-800/50 text-zinc-500 hover:bg-zinc-800"
                        }`}
                      >
                        <span className="text-base leading-none">
                          {(() => {
                            const Icon = SOURCE_CONFIG[s].icon;
                            return <Icon className="w-5 h-5" />;
                          })()}
                        </span>
                        {SOURCE_CONFIG[s].label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-zinc-400 text-xs">مدينة الشحن</Label>
                <Select
                  value={formData.shipping_city_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, shipping_city_id: value })
                  }
                >
                  <SelectTrigger className="h-14 bg-zinc-900 border-zinc-700 text-zinc-200 text-base disabled:opacity-40 w-full">
                    <SelectValue placeholder="اختر المدينة" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    <SelectItem value="">بدون شحن</SelectItem>
                    {Array.isArray(shippingCities)
                      ? shippingCities.map((city: any) => (
                          <SelectItem
                            key={city.id}
                            value={String(city.id)}
                            className="text-zinc-200"
                          >
                            {city.city_name} · {fmt(city.shipping_fee)} EGP
                          </SelectItem>
                        ))
                      : null}
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

              <div className="flex items-center gap-2 bg-zinc-800/50 rounded-lg px-3 py-2.5">
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
                  className="text-zinc-300 text-sm cursor-pointer flex items-center gap-1.5"
                >
                  <Truck className="w-3.5 h-3.5 text-violet-400" />
                  شحن عبر شركة توصيل
                </Label>
              </div>
            </div>

            {/* Add Items */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                المنتجات
              </p>

              {/* Product Picker */}
              <div className="bg-zinc-800/40 border border-zinc-700/50 rounded-xl p-4 space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {" "}
                  {/* Product */}
                  <div className="sm:col-span-5">
                    <label className="text-[11px] text-zinc-500 mb-1 block">
                      المنتج
                    </label>

                    <Select
                      value={newItem.product_id}
                      onValueChange={handleProductSelect}
                    >
                      <SelectTrigger className="h-14 bg-zinc-900 border-zinc-700 text-zinc-200 text-base disabled:opacity-40 w-full">
                        {" "}
                        <SelectValue placeholder="اختر المنتج" />
                      </SelectTrigger>

                      <SelectContent className="bg-zinc-900 border-zinc-700">
                        {products?.map((p: any) => (
                          <SelectItem
                            key={p.id}
                            value={String(p.id)}
                            className="text-zinc-200"
                          >
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Size */}
                  <div className="sm:col-span-3">
                    <label className="text-[11px] text-zinc-500 mb-1 block">
                      المقاس
                    </label>

                    <Select
                      value={newItem.size}
                      onValueChange={(v) => setNewItem({ ...newItem, size: v })}
                      disabled={!newItem.product_id}
                    >
                      <SelectTrigger className="h-10 bg-zinc-900 border-zinc-700 text-zinc-200 disabled:opacity-40  w-full">
                        <SelectValue placeholder="اختار المقاس" />
                      </SelectTrigger>

                      <SelectContent className="bg-zinc-900 border-zinc-700">
                        {availableSizes.map((size) => {
                          const v = variants.find((v) => v.size === size);

                          return (
                            <SelectItem
                              key={size}
                              value={size}
                              className="text-zinc-200"
                            >
                              {size}
                              <span className="text-zinc-500 ml-1">
                                ({v?.quantity})
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Qty */}
                  <div className="sm:col-span-2">
                    <label className="text-[11px] text-zinc-500 mb-1 block">
                      الكمية
                    </label>

                    <Input
                      type="number"
                      min="1"
                      placeholder="1"
                      value={newItem.quantity}
                      disabled={!newItem.size}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          quantity: e.target.value.replace(/^0+/, ""),
                        })
                      }
                      className="h-10 bg-zinc-900 border-zinc-700 text-white disabled:opacity-40"
                    />
                  </div>
                  {/* Add */}
                  <div className="sm:col-span-2 flex items-end">
                    <Button
                      onClick={handleAddItem}
                      disabled={
                        !newItem.product_id ||
                        !newItem.size ||
                        !newItem.quantity
                      }
                      className="w-full h-10 bg-indigo-600 hover:bg-indigo-500 text-base"
                    >
                      إضافة
                    </Button>
                  </div>
                </div>
              </div>

              {/* Items */}
              {items.length > 0 ? (
                <div className="rounded-xl overflow-hidden border border-zinc-700/50">
                  <div className="divide-y divide-zinc-700/50">
                    {items.map((item, idx) => {
                      const product = products?.find(
                        (p: any) => p.id === item.product_id,
                      );

                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-zinc-800/40 hover:bg-zinc-800 transition"
                        >
                          <div className="flex flex-col">
                            <span className="text-sm text-white font-medium">
                              {product?.name}
                            </span>

                            <span className="text-xs text-zinc-500">
                              {item.size} × {item.quantity}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-emerald-400 text-sm font-semibold">
                              {fmt(item.quantity * item.price_at_sale)} EGP
                            </span>

                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-zinc-500 hover:text-red-400"
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

                  {/* Total */}
                  <div className="bg-zinc-900 p-3 space-y-2">
                    <div className="flex justify-between text-xs text-zinc-500">
                      <span>المجموع</span>
                      <span>{fmt(subtotal)} EGP</span>
                    </div>

                    {discountAmount > 0 && (
                      <div className="flex justify-between text-xs text-red-400">
                        <span>خصم</span>
                        <span>-{fmt(discountAmount)} EGP</span>
                      </div>
                    )}

                    <div className="flex justify-between border-t border-zinc-700 pt-2 text-emerald-400 font-bold">
                      <span>الإجمالي</span>
                      <span>{fmt(totalPrice)} EGP</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-zinc-700 rounded-xl py-8 text-center text-zinc-600">
                  <Package2 className="mx-auto w-7 h-7 mb-2 opacity-40" />

                  <p className="text-xs">لسه مفيش منتجات مضافة</p>
                </div>
              )}
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading || items.length === 0}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40"
            >
              {loading
                ? "جاري الإنشاء..."
                : items.length > 0
                  ? `إنشاء الطلب · ${fmt(totalPrice)} EGP`
                  : "إنشاء الطلب"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
