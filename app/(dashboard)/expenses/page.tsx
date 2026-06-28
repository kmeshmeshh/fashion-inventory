/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useExpenses, useCreateExpense } from "@/hooks/useExpenses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, DollarSign } from "lucide-react";

const EXPENSE_CATEGORIES = ["packaging", "marketing", "transport", "other"];

const CATEGORY_LABELS: Record<string, string> = {
  packaging: "تغليف",
  marketing: "تسويق",
  transport: "مواصلات",
  other: "أخرى",
};

const CATEGORY_COLORS: Record<string, string> = {
  packaging: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  marketing: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  transport: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  other: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

export default function ExpensesPage() {
  const { data: expenses, isLoading } = useExpenses();
  const createExpense = useCreateExpense();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: "packaging",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = async () => {
    if (!formData.amount) return;
    await createExpense.mutateAsync({
      category: formData.category,
      amount: parseFloat(formData.amount),
      description: formData.description,
      date: formData.date,
    });
    setFormData({
      category: "packaging",
      amount: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
    });
    setOpen(false);
  };

  const totalsByCategory = expenses?.reduce((acc: any, exp: any) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {});

  const totalExpenses =
    expenses?.reduce((sum: number, exp: any) => sum + exp.amount, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            المصاريف
          </h1>
          <p className="text-zinc-500 text-sm mt-1">تتبع وإدارة المصاريف</p>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">إضافة مصروف</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="bg-zinc-900 border-zinc-800 rounded-2xl max-h-[95vh] overflow-y-auto mx-3 mb-3 px-4 pb-6"
          >
            <SheetHeader className="mb-6">
              <SheetTitle className="text-white text-right">
                إضافة مصروف جديد
              </SheetTitle>
            </SheetHeader>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-zinc-400 text-xs">الفئة</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) =>
                    setFormData({ ...formData, category: v })
                  }
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <SelectItem
                        key={cat}
                        value={cat}
                        className="text-zinc-200 focus:bg-zinc-700"
                      >
                        {CATEGORY_LABELS[cat]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-zinc-400 text-xs">المبلغ (EGP)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-zinc-400 text-xs">الوصف (اختياري)</Label>
                <Input
                  placeholder="وصف المصروف"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-zinc-400 text-xs">التاريخ</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={createExpense.isPending || !formData.amount}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white mt-2"
              >
                {createExpense.isPending ? "جاري الحفظ..." : "حفظ المصروف"}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="bg-zinc-900 border-zinc-800 col-span-2 lg:col-span-1">
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500 mb-1">إجمالي المصاريف</p>
            <p className="text-xl font-bold text-red-400">
              {totalExpenses.toFixed(0)} EGP
            </p>
          </CardContent>
        </Card>
        {EXPENSE_CATEGORIES.map((cat) => (
          <Card key={cat} className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <p className="text-xs text-zinc-500 mb-1">
                {CATEGORY_LABELS[cat]}
              </p>
              <p className="text-lg font-bold text-white">
                {(totalsByCategory?.[cat] || 0).toFixed(0)} EGP
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 bg-zinc-800 rounded-xl" />
          ))}
        </div>
      ) : !expenses?.length ? (
        <div className="flex flex-col items-center justify-center h-48 text-zinc-600">
          <DollarSign className="w-8 h-8 mb-2 opacity-40" />
          <p className="text-sm">لا توجد مصاريف بعد</p>
        </div>
      ) : (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2 border-b border-zinc-800">
            <CardTitle className="text-sm text-zinc-400">
              سجل المصاريف
            </CardTitle>
          </CardHeader>
          <div className="divide-y divide-zinc-800">
            {expenses.map((exp: any) => (
              <div
                key={exp.id}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-medium ${CATEGORY_COLORS[exp.category] || "bg-zinc-800 text-zinc-400"}`}
                  >
                    {CATEGORY_LABELS[exp.category] || exp.category}
                  </Badge>
                  <div>
                    <p className="text-sm text-zinc-200">
                      {exp.description || "—"}
                    </p>
                    <p className="text-xs text-zinc-600">
                      {new Date(exp.date).toLocaleDateString("ar-EG")}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-red-400">
                  -{exp.amount.toFixed(0)} EGP
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
