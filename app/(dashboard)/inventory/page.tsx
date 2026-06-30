"use client";

import { useMemo, useState } from "react";
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useUpsertProductVariant,
} from "@/hooks/useProducts";
import { Product, ProductVariant } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Package,
  Pencil,
  Trash2,
  Search,
  Boxes,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Percent,
  Layers,
} from "lucide-react";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;
const defaultSizes: Record<(typeof SIZES)[number], number> = {
  XS: 0,
  S: 0,
  M: 0,
  L: 0,
  XL: 0,
  XXL: 0,
};
const LOW_STOCK_THRESHOLD = 5;

type ProductWithVariants = Product & {
  product_variants?: ProductVariant[];
};

const fmt = (n: number) =>
  new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 0 }).format(n);

export default function InventoryPage() {
  const { data: products, isLoading, refetch } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const upsertProductVariant = useUpsertProductVariant();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "out">("all");
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    cost_per_unit: "",
    selling_price: "",
  });
  const [sizes, setSizes] = useState<typeof defaultSizes>({ ...defaultSizes });

  const totalStock = (product: ProductWithVariants) =>
    product.product_variants?.reduce((s, v) => s + v.quantity, 0) || 0;

  const openAdd = () => {
    setEditingId(null);
    setFormData({ sku: "", name: "", cost_per_unit: "", selling_price: "" });
    setSizes({ ...defaultSizes });
    setSheetOpen(true);
  };

  const openEdit = (product: ProductWithVariants) => {
    setEditingId(product.id);
    setFormData({
      sku: product.sku,
      name: product.name,
      cost_per_unit: product.cost_per_unit.toString(),
      selling_price: product.selling_price.toString(),
    });
    const sizesMap = { ...defaultSizes };
    product.product_variants?.forEach((v) => {
      sizesMap[v.size as keyof typeof sizesMap] = v.quantity;
    });
    setSizes(sizesMap);
    setSheetOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteProduct.mutateAsync(id);
      await refetch();
    } catch (error) {
      alert(
        `❌ خطأ في الحذف: ${error instanceof Error ? error.message : "خطأ"}`,
      );
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        sku: formData.sku,
        name: formData.name,
        cost_per_unit: parseFloat(formData.cost_per_unit),
        selling_price: parseFloat(formData.selling_price),
      };

      if (editingId) {
        await updateProduct.mutateAsync({ id: editingId, ...payload });
        const product = products?.find((p: any) => p.id === editingId);
        const existingVariantSizes = new Set(
          product?.product_variants?.map((variant) => variant.size) || [],
        );

        for (const [size, qty] of Object.entries(sizes) as [string, number][]) {
          if (qty > 0 || existingVariantSizes.has(size)) {
            await upsertProductVariant.mutateAsync({
              productId: editingId,
              size,
              quantity: qty,
            });
          }
        }
      } else {
        const product = await createProduct.mutateAsync(payload);
        if (product?.id) {
          for (const [size, qty] of Object.entries(sizes) as [
            string,
            number,
          ][]) {
            if (qty > 0) {
              await upsertProductVariant.mutateAsync({
                productId: product.id,
                size,
                quantity: qty,
              });
            }
          }
        }
      }

      setSheetOpen(false);
      await refetch();
    } catch (error) {
      alert(`❌ ${error instanceof Error ? error.message : "خطأ"}`);
    } finally {
      setLoading(false);
    }
  };

  // Stats
  const {
    totalProducts,
    totalUnits,
    totalVariants,
    lowStockCount,
    outOfStockCount,
    inventoryValue,
    averageMargin,
  } = useMemo(() => {
    const productList = products || [];
    const totals = productList.reduce(
      (acc, product) => {
        const stock = totalStock(product);
        const margin =
          product.selling_price > 0
            ? ((product.selling_price - product.cost_per_unit) /
                product.selling_price) *
              100
            : 0;

        acc.totalUnits += stock;
        acc.totalVariants += product.product_variants?.length || 0;
        acc.inventoryValue += stock * (product.selling_price || 0);
        acc.marginSum += margin;
        acc.marginCount += product.selling_price > 0 ? 1 : 0;

        if (stock > 0 && stock <= LOW_STOCK_THRESHOLD) {
          acc.lowStockCount += 1;
        }
        if (stock === 0) {
          acc.outOfStockCount += 1;
        }

        return acc;
      },
      {
        totalUnits: 0,
        totalVariants: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        inventoryValue: 0,
        marginSum: 0,
        marginCount: 0,
      },
    );

    return {
      totalProducts: productList.length,
      totalUnits: totals.totalUnits,
      totalVariants: totals.totalVariants,
      lowStockCount: totals.lowStockCount,
      outOfStockCount: totals.outOfStockCount,
      inventoryValue: totals.inventoryValue,
      averageMargin:
        totals.marginCount > 0 ? totals.marginSum / totals.marginCount : 0,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    let list = products || [];
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q),
      );
    }
    if (stockFilter === "low") {
      list = list.filter((p) => {
        const t = totalStock(p);
        return t > 0 && t <= LOW_STOCK_THRESHOLD;
      });
    }
    if (stockFilter === "out") {
      list = list.filter((p) => totalStock(p) === 0);
    }
    return list;
  }, [products, searchQuery, stockFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            المخزن
          </h1>
          <p className="text-zinc-500 text-sm mt-1">إدارة المنتجات والمقاسات</p>
        </div>
        <Button
          size="sm"
          onClick={openAdd}
          className="bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">إضافة منتج</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-zinc-500">عدد المنتجات</p>
                <p className="text-xl font-bold text-white tabular-nums">
                  {totalProducts}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-zinc-800">
                <Package className="w-4 h-4 text-indigo-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-zinc-500">إجمالي القطع</p>
                <p className="text-xl font-bold text-white tabular-nums">
                  {fmt(totalUnits)}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-zinc-800">
                <Boxes className="w-4 h-4 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-zinc-500">إجمالي الأحجام</p>
                <p className="text-xl font-bold text-white tabular-nums">
                  {totalVariants}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-zinc-800">
                <Layers className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-zinc-500">قيمة المخزون</p>
                <p className="text-xl font-bold text-emerald-400 tabular-nums">
                  {fmt(inventoryValue)}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          role="button"
          onClick={() => setStockFilter(stockFilter === "low" ? "all" : "low")}
          className={`bg-zinc-900 cursor-pointer transition-colors ${
            stockFilter === "low"
              ? "border-amber-500/50 ring-1 ring-amber-500/30"
              : "border-zinc-800 hover:border-zinc-700"
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-zinc-500">مخزون منخفض</p>
                <p className="text-xl font-bold text-amber-400 tabular-nums">
                  {lowStockCount}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-amber-500/10">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-zinc-500">المنتجات النافدة</p>
                <p className="text-xl font-bold text-red-400 tabular-nums">
                  {outOfStockCount}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-red-500/10">
                <DollarSign className="w-4 h-4 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-zinc-500">متوسط هامش الربح</p>
                <p className="text-xl font-bold text-white tabular-nums">
                  {averageMargin.toFixed(0)}%
                </p>
              </div>
              <div className="p-2 rounded-lg bg-zinc-800">
                <Percent className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <Input
                placeholder="بحث بالاسم أو SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 text-sm pr-9"
              />
            </div>
            <div className="flex gap-2 shrink-0">
              {(
                [
                  { key: "all", label: "الكل" },
                  { key: "low", label: "منخفض" },
                  { key: "out", label: "نافد" },
                ] as const
              ).map((f) => (
                <button
                  key={f.key}
                  onClick={() => setStockFilter(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    stockFilter === f.key
                      ? "bg-indigo-600 text-white"
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 bg-zinc-800 rounded-xl" />
          ))}
        </div>
      ) : !filteredProducts?.length ? (
        <div className="flex flex-col items-center justify-center h-56 text-zinc-600 gap-1.5">
          <Package className="w-10 h-10 opacity-30" />
          <p className="text-sm text-zinc-500">
            {searchQuery || stockFilter !== "all"
              ? "لا توجد منتجات مطابقة"
              : "لا توجد منتجات بعد"}
          </p>
          {!searchQuery && stockFilter === "all" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={openAdd}
              className="mt-1 text-indigo-400 hover:text-indigo-300"
            >
              أضف أول منتج
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredProducts.map((product: ProductWithVariants) => {
            const stock = totalStock(product);
            const isLow = stock > 0 && stock <= LOW_STOCK_THRESHOLD;
            const isOut = stock === 0;
            const margin =
              product.selling_price > 0
                ? ((product.selling_price - product.cost_per_unit) /
                    product.selling_price) *
                  100
                : 0;

            return (
              <Card
                key={product.id}
                className={`bg-zinc-900 hover:border-zinc-700 transition-colors ${
                  isOut
                    ? "border-red-500/20"
                    : isLow
                      ? "border-amber-500/20"
                      : "border-zinc-800"
                }`}
              >
                <CardContent className="p-4 space-y-3">
                  {/* Product Header */}
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-white text-sm truncate">
                        {product.name}
                      </h3>
                      <p className="text-xs text-zinc-600 mt-0.5">
                        SKU: {product.sku}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-zinc-400 hover:text-white hover:bg-zinc-800"
                        onClick={() => openEdit(product)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-zinc-400 hover:text-red-400 hover:bg-zinc-800"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-white">
                              حذف المنتج
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-zinc-400">
                              هل متأكد من حذف {product.name}؟ لا يمكن التراجع.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">
                              إلغاء
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(product.id)}
                              className="bg-red-600 hover:bg-red-500 text-white"
                            >
                              حذف
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  {/* Prices */}
                  <div className="flex gap-3 text-xs">
                    <div className="flex-1 bg-zinc-800 rounded-lg p-2 text-center">
                      <p className="text-zinc-500 mb-0.5">التكلفة</p>
                      <p className="font-semibold text-zinc-200 tabular-nums">
                        {fmt(product.cost_per_unit)} EGP
                      </p>
                    </div>
                    <div className="flex-1 bg-emerald-500/10 rounded-lg p-2 text-center">
                      <p className="text-emerald-600 mb-0.5">البيع</p>
                      <p className="font-semibold text-emerald-400 tabular-nums">
                        {fmt(product.selling_price)} EGP
                      </p>
                    </div>
                    <div className="flex-1 bg-violet-500/10 rounded-lg p-2 text-center">
                      <p className="text-violet-500 mb-0.5">الهامش</p>
                      <p className="font-semibold text-violet-400 tabular-nums">
                        {margin.toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  {/* Sizes */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs text-zinc-600">المقاسات</p>
                      <Badge
                        variant="outline"
                        className={`text-[10px] tabular-nums ${
                          isOut
                            ? "border-red-500/30 text-red-400"
                            : isLow
                              ? "border-amber-500/30 text-amber-400"
                              : "border-zinc-700 text-zinc-500"
                        }`}
                      >
                        {isOut && "نافد · "}
                        {isLow && !isOut && "منخفض · "}
                        {stock} قطعة
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {product.product_variants?.map((v) => (
                        <div
                          key={v.id}
                          className={`px-2 py-1 rounded text-[10px] font-medium text-center ${
                            v.quantity === 0
                              ? "bg-zinc-800 text-zinc-600"
                              : v.quantity <= LOW_STOCK_THRESHOLD
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                          }`}
                        >
                          {v.size}
                          <span className="mr-1 text-zinc-500">
                            {v.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Bottom Sheet Form */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="bottom"
          className="bg-zinc-900 border-zinc-800 rounded-2xl max-h-[95vh] overflow-y-auto mx-3 mb-3 px-4 pb-6"
        >
          <SheetHeader className="mb-5">
            <SheetTitle className="text-white text-right">
              {editingId ? "تعديل المنتج" : "إضافة منتج جديد"}
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-zinc-400 text-xs">SKU</Label>
                <Input
                  placeholder="SKU-001"
                  value={formData.sku}
                  onChange={(e) =>
                    setFormData({ ...formData, sku: e.target.value })
                  }
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-400 text-xs">الاسم</Label>
                <Input
                  placeholder="اسم المنتج"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-400 text-xs">التكلفة (EGP)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.cost_per_unit}
                  onChange={(e) =>
                    setFormData({ ...formData, cost_per_unit: e.target.value })
                  }
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-400 text-xs">سعر البيع (EGP)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.selling_price}
                  onChange={(e) =>
                    setFormData({ ...formData, selling_price: e.target.value })
                  }
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
                />
              </div>
            </div>

            {formData.cost_per_unit && formData.selling_price && (
              <div className="flex items-center justify-between bg-violet-500/10 rounded-lg px-3 py-2">
                <span className="text-xs text-zinc-400">
                  هامش الربح المتوقع
                </span>
                <span className="text-sm font-bold text-violet-400 tabular-nums">
                  {(
                    ((parseFloat(formData.selling_price) -
                      parseFloat(formData.cost_per_unit)) /
                      parseFloat(formData.selling_price)) *
                    100
                  ).toFixed(0)}
                  %
                </span>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-zinc-400 text-xs">
                الكميات حسب المقاس
              </Label>
              <div className="grid grid-cols-6 gap-2">
                {SIZES.map((size) => (
                  <div key={size} className="space-y-1">
                    <p className="text-center text-xs font-medium text-zinc-500">
                      {size}
                    </p>
                    <Input
                      type="number"
                      min="0"
                      value={sizes[size as keyof typeof sizes]}
                      onChange={(e) =>
                        setSizes((prev) => ({
                          ...prev,
                          [size]: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="bg-zinc-800 border-zinc-700 text-white text-center px-1"
                    />
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40"
            >
              {loading ? "جاري الحفظ..." : "حفظ المنتج"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
