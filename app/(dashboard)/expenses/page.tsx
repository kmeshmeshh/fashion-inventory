/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useExpenses, useCreateExpense } from "@/hooks/useExpenses";

const EXPENSE_CATEGORIES = ["packaging", "marketing", "transport", "other"];

export default function ExpensesPage() {
  const { data: expenses, isLoading } = useExpenses();
  const createExpense = useCreateExpense();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    category: "packaging",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
    setShowForm(false);
  };

  // Calculate totals by category
  const totalsByCategory = expenses?.reduce((acc: any, exp: any) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {});

  const totalExpenses =
    expenses?.reduce((sum: number, exp: any) => sum + exp.amount, 0) || 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">💰 Expenses</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          {showForm ? "Cancel" : "Add Expense"}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-xs text-gray-500">Total Expenses</p>
          <p className="text-2xl font-bold text-red-600">
            {totalExpenses.toFixed(2)} EGP
          </p>
        </div>
        {EXPENSE_CATEGORIES.map((cat) => (
          <div key={cat} className="bg-white p-4 rounded-lg shadow">
            <p className="text-xs text-gray-500 capitalize">{cat}</p>
            <p className="text-xl font-bold">
              {(totalsByCategory?.[cat] || 0).toFixed(2)} EGP
            </p>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="border rounded px-3 py-2 w-full"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Amount (EGP)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  required
                  className="border rounded px-3 py-2 w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="border rounded px-3 py-2 w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="border rounded px-3 py-2 w-full"
              />
            </div>

            <button
              type="submit"
              disabled={createExpense.isPending}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded w-full disabled:opacity-50"
            >
              {createExpense.isPending ? "Adding..." : "Add Expense"}
            </button>
          </form>
        </div>
      )}

      {/* Expenses List */}
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium">
                  Description
                </th>
                <th className="px-6 py-3 text-right text-sm font-medium">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {expenses?.map((exp: any) => (
                <tr key={exp.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">
                    {new Date(exp.date).toLocaleDateString("ar-EG")}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-gray-200 rounded-full text-xs font-medium">
                      {exp.category.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {exp.description || "-"}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-red-600">
                    {exp.amount.toFixed(2)} EGP
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
