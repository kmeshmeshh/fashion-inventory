/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState } from "react";
import { useCustomers } from "@/hooks/useCustomers";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Phone, MapPin, Search, Crown } from "lucide-react";

const AVATAR_COLORS = [
  "bg-indigo-500/15 text-indigo-400",
  "bg-pink-500/15 text-pink-400",
  "bg-emerald-500/15 text-emerald-400",
  "bg-amber-500/15 text-amber-400",
  "bg-violet-500/15 text-violet-400",
  "bg-blue-500/15 text-blue-400",
];

const colorFor = (name: string) => {
  const idx =
    name?.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0) %
    AVATAR_COLORS.length;
  return AVATAR_COLORS[idx || 0];
};

const initials = (name: string) =>
  name
    ?.trim()
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "؟";

type SortKey = "orders_desc" | "name_asc" | "newest";

export default function CustomersPage() {
  const { data: customers, isLoading } = useCustomers();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("orders_desc");

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = (customers || []).filter((c: any) => {
      if (!q) return true;
      return (
        c.name?.toLowerCase().includes(q) || c.phone?.toLowerCase().includes(q)
      );
    });

    list = [...list].sort((a: any, b: any) => {
      if (sortKey === "orders_desc")
        return (b.orders_count || 0) - (a.orders_count || 0);
      if (sortKey === "name_asc")
        return (a.name || "").localeCompare(b.name || "", "ar");
      return (
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime()
      );
    });

    return list;
  }, [customers, searchQuery, sortKey]);

  const totalCustomers = customers?.length || 0;
  const totalOrders = (customers || []).reduce(
    (s: number, c: any) => s + (c.orders_count || 0),
    0,
  );
  const topCustomer = (customers || []).reduce(
    (top: any, c: any) =>
      (c.orders_count || 0) > (top?.orders_count || 0) ? c : top,
    null,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            العملاء
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            {filteredCustomers.length} من {totalCustomers} عميل
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-zinc-500">إجمالي العملاء</p>
                <p className="text-xl font-bold text-white tabular-nums">
                  {totalCustomers}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-zinc-800">
                <Users className="w-4 h-4 text-indigo-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-zinc-500">إجمالي الطلبات</p>
                <p className="text-xl font-bold text-white tabular-nums">
                  {totalOrders}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-zinc-800">
                <Phone className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 col-span-2 lg:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] text-zinc-500">أكثر عميل طلباً</p>
                <p className="text-sm font-bold text-white truncate">
                  {topCustomer?.name || "—"}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-amber-500/10 shrink-0">
                <Crown className="w-4 h-4 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Sort */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <Input
                placeholder="بحث بالاسم أو رقم الهاتف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 text-sm pr-9"
              />
            </div>
            <Select
              value={sortKey}
              onValueChange={(v) => setSortKey(v as SortKey)}
            >
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-300 text-sm sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem
                  value="orders_desc"
                  className="text-zinc-200 focus:bg-zinc-700"
                >
                  الأكثر طلباً
                </SelectItem>
                <SelectItem
                  value="name_asc"
                  className="text-zinc-200 focus:bg-zinc-700"
                >
                  الاسم (أ-ي)
                </SelectItem>
                <SelectItem
                  value="newest"
                  className="text-zinc-200 focus:bg-zinc-700"
                >
                  الأحدث إضافة
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 bg-zinc-800 rounded-xl" />
          ))}
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-zinc-600 gap-1.5">
          <Users className="w-10 h-10 opacity-30" />
          <p className="text-sm text-zinc-500">
            {searchQuery ? "لا يوجد عملاء مطابقين للبحث" : "لسه مفيش عملاء"}
          </p>
          {!searchQuery && (
            <p className="text-xs text-zinc-700">
              هيتم إضافتهم تلقائياً أول ما تعمل طلب جديد
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCustomers.map((customer: any) => {
            const isTop =
              topCustomer &&
              customer.id === topCustomer.id &&
              customer.orders_count > 0;
            return (
              <Card
                key={customer.id}
                className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback
                        className={`text-xs font-bold ${colorFor(customer.name)}`}
                      >
                        {initials(customer.name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-white truncate">
                          {customer.name}
                        </p>
                        {isTop && (
                          <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5 text-xs text-zinc-500">
                        <Phone className="w-3 h-3 shrink-0" />
                        <span dir="ltr">{customer.phone}</span>
                      </div>
                      {customer.address && (
                        <div className="flex items-center gap-1 mt-0.5 text-xs text-zinc-600">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{customer.address}</span>
                        </div>
                      )}
                    </div>

                    <Badge
                      variant="outline"
                      className="border-indigo-500/30 text-indigo-400 shrink-0 tabular-nums"
                    >
                      {customer.orders_count || 0} طلب
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
