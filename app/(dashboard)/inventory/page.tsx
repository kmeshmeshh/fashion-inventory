/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useProducts, useCreateProduct } from "@/hooks/useProducts";
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
import { Plus, Package, Pencil, Trash2 } from "lucide-react";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

const defaultSizes = { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 };

export default function InventoryPage() {
  const { data: products, isLoading, refetch } = useProducts();
  const createProduct = useCreateProduct();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    cost_per_unit: "",
    selling_price: "",
  });
  const [sizes, setSizes] = useState<typeof defaultSizes>({ ...defaultSizes });

  const openAdd = () => {
    setEditingId(null);
    setFormData({ sku: "", name: "", cost_per_unit: "", selling_price: "" });
    setSizes({ ...defaultSizes });
    setSheetOpen(true);
  };

  const openEdit = (product: any) => {
    setEditingId(product.id);
    setFormData({
      sku: product.sku,
      name: product.name,
      cost_per_unit: product.cost_per_unit.toString(),
      selling_price: product.selling_price.toString(),
    });
    const sizesMap: any = { ...defaultSizes };
    product.product_variants?.forEach((v: any) => {
      sizesMap[v.size] = v.quantity;
    });
    setSizes(sizesMap);
    setSheetOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      await refetch();
    } catch {
      alert("❌ خطأ في الحذف");
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (editingId) {
        const res = await fetch(`/api/products/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sku: formData.sku,
            name: formData.name,
            cost_per_unit: parseFloat(formData.cost_per_unit),
            selling_price: parseFloat(formData.selling_price),
          }),
        });
        if (!res.ok) throw new Error();
        for (const [size, qty] of Object.entries(sizes)) {
          if (qty > 0) {
            await fetch(`/api/products/${editingId}/variants`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ size, quantity: qty }),
            });
          }
        }
      } else {
        const productRes = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sku: formData.sku,
            name: formData.name,
            cost_per_unit: parseFloat(formData.cost_per_unit),
            selling_price: parseFloat(formData.selling_price),
          }),
        });
        if (!productRes.ok) throw new Error();
        const product = await productRes.json();
        if (product?.id) {
          for (const [size, qty] of Object.entries(sizes)) {
            if (qty > 0) {
              await fetch(`/api/products/${product.id}/variants`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ size, quantity: qty }),
              });
            }
          }
        }
      }
      setSheetOpen(false);
      await refetch();
    } catch {
      alert("❌ خطأ");
    } finally {
      setLoading(false);
    }
  };

  const totalStock = (product: any) =>
    product.product_variants?.reduce(
      (s: number, v: any) => s + v.quantity,
      0,
    ) || 0;

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

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 bg-zinc-800 rounded-xl" />
          ))}
        </div>
      ) : !products?.length ? (
        <div className="flex flex-col items-center justify-center h-56 text-zinc-600">
          <Package className="w-10 h-10 mb-2 opacity-40" />
          <p className="text-sm">لا توجد منتجات بعد</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={openAdd}
            className="mt-3 text-indigo-400 hover:text-indigo-300"
          >
            أضف أول منتج
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {products.map((product: any) => (
            <Card
              key={product.id}
              className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              <CardContent className="p-4 space-y-3">
                {/* Product Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-white text-sm">
                      {product.name}
                    </h3>
                    <p className="text-xs text-zinc-600 mt-0.5">
                      SKU: {product.sku}
                    </p>
                  </div>
                  <div className="flex gap-1">
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
                    <p className="font-semibold text-zinc-200">
                      {product.cost_per_unit} EGP
                    </p>
                  </div>
                  <div className="flex-1 bg-emerald-500/10 rounded-lg p-2 text-center">
                    <p className="text-emerald-600 mb-0.5">البيع</p>
                    <p className="font-semibold text-emerald-400">
                      {product.selling_price} EGP
                    </p>
                  </div>
                </div>

                {/* Sizes */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs text-zinc-600">المقاسات</p>
                    <Badge
                      variant="outline"
                      className="text-[10px] border-zinc-700 text-zinc-500"
                    >
                      {totalStock(product)} قطعة
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {product.product_variants?.map((v: any) => (
                      <div
                        key={v.id}
                        className={`px-2 py-1 rounded text-[10px] font-medium text-center ${
                          v.quantity === 0
                            ? "bg-zinc-800 text-zinc-600"
                            : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                        }`}
                      >
                        {v.size}
                        <span className="ml-1 text-zinc-500">{v.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              {loading ? "جاري الحفظ..." : "حفظ المنتج"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
