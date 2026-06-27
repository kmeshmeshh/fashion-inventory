/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useProducts, useCreateProduct } from "@/hooks/useProducts";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

export default function InventoryPage() {
  const { data: products, isLoading, refetch } = useProducts();
  const createProduct = useCreateProduct();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    cost_per_unit: "",
    selling_price: "",
  });
  const [sizes, setSizes] = useState({
    XS: 0,
    S: 0,
    M: 0,
    L: 0,
    XL: 0,
    XXL: 0,
  });

  const handleSizeChange = (size: string, value: string) => {
    setSizes((prev) => ({
      ...prev,
      [size]: parseInt(value) || 0,
    }));
  };

  const handleEdit = (product: any) => {
    setEditingId(product.id);
    setFormData({
      sku: product.sku,
      name: product.name,
      cost_per_unit: product.cost_per_unit.toString(),
      selling_price: product.selling_price.toString(),
    });

    const sizesMap: any = { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 };
    product.product_variants?.forEach((v: any) => {
      sizesMap[v.size] = v.quantity;
    });
    setSizes(sizesMap);

    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل متأكد من حذف المنتج؟")) return;

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      await refetch();
      alert("✅ تم حذف المنتج!");
    } catch (err) {
      alert("❌ خطأ");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

        if (!res.ok) throw new Error("Failed to update");

        for (const [size, qty] of Object.entries(sizes)) {
          if (qty > 0) {
            await fetch(`/api/products/${editingId}/variants`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ size, quantity: qty }),
            });
          }
        }

        alert("✅ تم تحديث المنتج!");
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

        if (!productRes.ok) throw new Error("Failed to create");

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

        alert("✅ تم إنشاء المنتج!");
      }

      setFormData({ sku: "", name: "", cost_per_unit: "", selling_price: "" });
      setSizes({ XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 });
      setEditingId(null);
      setShowForm(false);

      await refetch();
    } catch (err) {
      alert("❌ خطأ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">📦 المخزن</h1>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({
              sku: "",
              name: "",
              cost_per_unit: "",
              selling_price: "",
            });
            setSizes({ XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 });
            setShowForm(!showForm);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          {showForm ? "إلغاء" : "➕ إضافة منتج"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-bold mb-4">
            {editingId ? "✏️ تعديل" : "➕ إضافة"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="SKU"
                value={formData.sku}
                onChange={(e) =>
                  setFormData({ ...formData, sku: e.target.value })
                }
                required
                className="border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="الاسم"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                className="border rounded px-3 py-2"
              />
              <input
                type="number"
                placeholder="التكلفة"
                value={formData.cost_per_unit}
                onChange={(e) =>
                  setFormData({ ...formData, cost_per_unit: e.target.value })
                }
                step="0.01"
                required
                className="border rounded px-3 py-2"
              />
              <input
                type="number"
                placeholder="البيع"
                value={formData.selling_price}
                onChange={(e) =>
                  setFormData({ ...formData, selling_price: e.target.value })
                }
                step="0.01"
                required
                className="border rounded px-3 py-2"
              />
            </div>

            <div>
              <h3 className="font-bold mb-3">المقاسات</h3>
              <div className="grid grid-cols-6 gap-2">
                {SIZES.map((size) => (
                  <div key={size}>
                    <label className="text-xs font-bold">{size}</label>
                    <input
                      type="number"
                      min="0"
                      value={sizes[size as keyof typeof sizes]}
                      onChange={(e) => handleSizeChange(size, e.target.value)}
                      className="w-full border rounded px-2 py-1 text-center"
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 text-white px-6 py-2 rounded w-full disabled:opacity-50"
            >
              {loading ? "جاري..." : "حفظ"}
            </button>
          </form>
        </div>
      )}

      {isLoading ? (
        <p>جاري التحميل...</p>
      ) : !products || products.length === 0 ? (
        <p className="text-gray-500">لا توجد منتجات</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {products.map((product: any) => (
            <div key={product.id} className="bg-white p-4 rounded shadow">
              <div className="flex justify-between mb-2">
                <div>
                  <h3 className="font-bold">{product.name}</h3>
                  <p className="text-xs text-gray-600">SKU: {product.sku}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(product)}
                    className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="bg-red-500 text-white px-2 py-1 rounded text-xs"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className="text-sm mb-2">
                <p>التكلفة: {product.cost_per_unit} EGP</p>
                <p className="text-green-600">
                  البيع: {product.selling_price} EGP
                </p>
              </div>

              <div className="grid grid-cols-6 gap-1">
                {product.product_variants?.map((v: any) => (
                  <div
                    key={v.id}
                    className="bg-blue-100 p-1 rounded text-center text-xs"
                  >
                    <p className="font-bold">{v.size}</p>
                    <p>{v.quantity}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
