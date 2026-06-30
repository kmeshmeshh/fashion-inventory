/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState } from "react";
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
import {
  Plus,
  Receipt,
  Package,
  Megaphone,
  Truck,
  MoreHorizontal,
} from "lucide-react";

const EXPENSE_CATEGORIES = ["packaging", "marketing", "transport", "other"];

const CATEGORY_LABELS: Record<string, string> = {
  packaging: "تغليف",
  marketing: "تسويق",
  transport: "مواصلات",
  other: "أخرى",
};

const CATEGORY_ICONS: Record<string, any> = {
  packaging: Package,
  marketing: Megaphone,
  transport: Truck,
  other: MoreHorizontal,
};

const CATEGORY_COLORS: Record<string, string> = {
  packaging: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  marketing: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  transport: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  other: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

const CATEGORY_ICON_BG: Record<string, string> = {
  packaging: "bg-blue-500/10 text-blue-400",
  marketing: "bg-pink-500/10 text-pink-400",
  transport: "bg-amber-500/10 text-amber-400",
  other: "bg-zinc-500/10 text-zinc-400",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 0 }).format(n);

export default function ExpensesPage() {
  const { data: expenses, isLoading } = useExpenses();
  const createExpense = useCreateExpense();
  const [open, setOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
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

  const totalsByCategory = useMemo(
    () =>
      expenses?.reduce((acc: any, exp: any) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        return acc;
      }, {}) || {},
    [expenses],
  );

  const totalExpenses =
    expenses?.reduce((sum: number, exp: any) => sum + exp.amount, 0) || 0;

  const biggestCategory = EXPENSE_CATEGORIES.reduce((top, cat) => {
    const amt = totalsByCategory[cat] || 0;
    return amt > (totalsByCategory[top] || 0) ? cat : top;
  }, EXPENSE_CATEGORIES[0]);

  const filteredExpenses = (expenses || []).filter((exp: any) =>
    activeFilter ? exp.category === activeFilter : true,
  );

  // Group filtered expenses by date for a clearer log
  const groupedByDate = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filteredExpenses
      .slice()
      .sort(
        (a: any, b: any) =>
          new Date(b.date).getTime() - new Date(a.date).getTime(),
      )
      .forEach((exp: any) => {
        const key = new Date(exp.date).toLocaleDateString("ar-EG");
        if (!groups[key]) groups[key] = [];
        groups[key].push(exp);
      });
    return groups;
  }, [filteredExpenses]);

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
                <div className="grid grid-cols-4 gap-2">
                  {EXPENSE_CATEGORIES.map((cat) => {
                    const Icon = CATEGORY_ICONS[cat];
                    const active = formData.category === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, category: cat })
                        }
                        className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-colors ${
                          active
                            ? "border-indigo-500 bg-indigo-500/10"
                            : "border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800"
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 ${
                            active ? "text-indigo-400" : "text-zinc-500"
                          }`}
                        />
                        <span
                          className={`text-[11px] font-medium ${
                            active ? "text-indigo-300" : "text-zinc-500"
                          }`}
                        >
                          {CATEGORY_LABELS[cat]}
                        </span>
                      </button>
                    );
                  })}
                </div>
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
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 text-lg font-semibold"
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
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white mt-2 disabled:opacity-40"
              >
                {createExpense.isPending ? "جاري الحفظ..." : "حفظ المصروف"}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Summary Cards — total is the hero, categories are tappable filters */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="bg-gradient-to-br from-red-950/30 via-zinc-900 to-zinc-900 border-red-500/20 col-span-2 lg:col-span-1">
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500 mb-1">إجمالي المصاريف</p>
            <p className="text-xl font-bold text-red-400 tabular-nums">
              {fmt(totalExpenses)}{" "}
              <span className="text-xs font-medium">EGP</span>
            </p>
          </CardContent>
        </Card>
        {EXPENSE_CATEGORIES.map((cat) => {
          const Icon = CATEGORY_ICONS[cat];
          const active = activeFilter === cat;
          const isBiggest =
            cat === biggestCategory && totalsByCategory[cat] > 0;
          return (
            <Card
              key={cat}
              role="button"
              onClick={() => setActiveFilter(active ? null : cat)}
              className={`bg-zinc-900 cursor-pointer transition-colors ${
                active
                  ? "border-indigo-500/50 ring-1 ring-indigo-500/30"
                  : "border-zinc-800 hover:border-zinc-700"
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-zinc-500">
                    {CATEGORY_LABELS[cat]}
                  </p>
                  <div className={`p-1 rounded ${CATEGORY_ICON_BG[cat]}`}>
                    <Icon className="w-3 h-3" />
                  </div>
                </div>
                <p className="text-lg font-bold text-white tabular-nums">
                  {fmt(totalsByCategory[cat] || 0)}
                </p>
                {isBiggest && (
                  <p className="text-[10px] text-amber-400 mt-0.5">
                    أكبر فئة مصروفات
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {activeFilter && (
        <button
          onClick={() => setActiveFilter(null)}
          className="text-xs text-indigo-400 hover:text-indigo-300 -mt-3"
        >
          إلغاء الفلتر: {CATEGORY_LABELS[activeFilter]} ✕
        </button>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 bg-zinc-800 rounded-xl" />
          ))}
        </div>
      ) : !filteredExpenses.length ? (
        <div className="flex flex-col items-center justify-center h-48 text-zinc-600 gap-1.5">
          <Receipt className="w-8 h-8 opacity-30" />
          <p className="text-sm text-zinc-500">
            {activeFilter
              ? "لا توجد مصاريف في هذه الفئة"
              : "لا توجد مصاريف بعد"}
          </p>
          {!activeFilter && (
            <p className="text-xs text-zinc-700">
              ابدأ بتسجيل أول مصروف من الزر بالأعلى
            </p>
          )}
        </div>
      ) : (
        <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
          <CardHeader className="pb-2 border-b border-zinc-800">
            <CardTitle className="text-sm text-zinc-400">
              سجل المصاريف
            </CardTitle>
          </CardHeader>
          <div className="divide-y divide-zinc-800">
            {Object.entries(groupedByDate).map(([date, items]) => (
              <div key={date}>
                <div className="px-5 py-2 bg-zinc-900/60">
                  <p className="text-[11px] font-medium text-zinc-600">
                    {date}
                  </p>
                </div>
                {items.map((exp: any) => {
                  const Icon = CATEGORY_ICONS[exp.category] || MoreHorizontal;
                  return (
                    <div
                      key={exp.id}
                      className="flex items-center justify-between px-5 py-3.5 hover:bg-zinc-800/50 transition-colors border-t border-zinc-800/50"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`p-2 rounded-lg shrink-0 ${CATEGORY_ICON_BG[exp.category] || "bg-zinc-800 text-zinc-400"}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-zinc-200 truncate">
                            {exp.description || CATEGORY_LABELS[exp.category]}
                          </p>
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-medium mt-1 ${CATEGORY_COLORS[exp.category] || "bg-zinc-800 text-zinc-400"}`}
                          >
                            {CATEGORY_LABELS[exp.category] || exp.category}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-red-400 shrink-0 tabular-nums">
                        -{fmt(exp.amount)} EGP
                      </p>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
