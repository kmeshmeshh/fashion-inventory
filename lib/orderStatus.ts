export const ORDER_STATUSES = [
  "pending",
  "prepared",
  "shipped",
  "delivered",
  "cancelled",
];

export const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  pending: {
    label: "قيد الانتظار",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  prepared: {
    label: "جاهز",
    className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  shipped: {
    label: "شُحن",
    className: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  },
  delivered: {
    label: "تم التسليم",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  cancelled: {
    label: "ملغى",
    className: "bg-red-500/10 text-red-400 border-red-500/20",
  },
};
