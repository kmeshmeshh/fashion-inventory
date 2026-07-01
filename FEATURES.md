# Fashion Inventory App Features

## Overview
This app is a fashion inventory and sales management dashboard built with Next.js App Router, TypeScript, Tailwind CSS, React Query, and Supabase.

## Authentication
- Email/password login page at `/login`
- User registration page at `/register`
- Protected dashboard routes behind authenticated layout
- Supabase authentication integration with sign-in, sign-up, and sign-out

## Dashboard (`/dashboard`)
- Overview KPIs for revenue, profit, expenses, orders, and cash flow
- Date range filtering:
  - This month
  - Last month
  - All time
  - Custom date range
- Charts and visualizations for financial performance
- Best seller and expense category summaries
- Revenue vs COGS vs expenses breakdown

## Inventory Management (`/inventory`)
- Product list display with SKU, product name, cost, selling price, stock, and variants
- Low-stock and out-of-stock filtering
- Product search by name or SKU
- Add new products with cost, selling price, and size quantity inputs
- Edit existing products, including prices and variant quantities
- Bulk save of product variants by size in a single action
- Suggested selling price based on default markup (40%)
- Expected profit margin preview for the product before saving
- Inventory statistics:
  - Total products
  - Total units
  - Total variant entries
  - Inventory value
  - Low-stock count
  - Out-of-stock count
  - Average profit margin
- Product cards show current margin percentage and stock status badges

## Orders (`/orders`)
- Order listing with search and filters
- Order creation and update flows
- Order status management and status labels
- Order source tracking (Facebook, Instagram, WhatsApp, Jumia, Other)
- Order item details and print invoice capability
- Automatic customer extraction from orders
- Order total calculations with shipping, discounts, and order items

## Customers (`/customers`)
- Customer list with search by name or phone
- Customer sorting by:
  - Most orders
  - Name (A–Z)
  - Newest customers
- Customer summary stats:
  - Total customers
  - Total orders
  - Top customer by order count
- Customer avatars generated from initials

## Expenses (`/expenses`)
- Expense tracking with categorization
- Add expense with category, amount, description, and date
- Expense categories:
  - Packaging
  - Marketing
  - Transport
  - Other
- Summary of expenses by category and total
- Filter expenses by selected category
- Date-grouped expense log

## Shipments (`/shipments`)
- Shipment management and courier assignment
- Create shipments with courier name, tracking number, and selected orders
- Manage shipping cities and shipping fees
- View shipment totals and assigned orders
- Update order shipping/status from shipment page
- Track assigned, shipped, delivered, and cancelled order counts

## Shared UI and Layout
- Left-side dashboard navigation with responsive mobile bottom navigation
- Dark styled admin theme with cards, badges, sheets, dialogs, and forms
- Reusable UI components from `components/ui`
- Data fetching and mutation hooks for products, orders, customers, expenses, shipments, analytics, and auth

## Data and API
- Supabase-backed API and client on the frontend
- Shared hooks for `useProducts`, `useOrders`, `useCustomers`, `useExpenses`, `useShipments`, `useShippingCities`, `useAnalytics`, and `useAuth`
- Custom API routes for auth and product/variant operations

## Notes
- The inventory screen includes size-level quantity tracking for each product variant
- Profit margin calculations are shown on product cards and in the add/edit product sheet
- The app has a mobile-friendly dashboard layout with sidebar navigation and bottom nav for smaller screens
