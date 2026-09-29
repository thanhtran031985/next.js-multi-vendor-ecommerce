// Shapes for dashboard widgets whose data models do not exist yet (orders, products,
// reviews, payouts, delivery). Loaders already return these fields, empty, so a later task
// only has to fill them in the loader. Money is in major units (e.g. dollars) for now.

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "packaging",
  "outForDelivery",
  "delivered",
  "canceled",
  "returned",
  "failed",
] as const;

export type OrderStatusKey = (typeof ORDER_STATUSES)[number];

/** Order count per status; null until the Order model exists. */
export type OrderStatusCounts = Record<OrderStatusKey, number> | null;

export type ChartPoint = { label: string; values: Record<string, number> };

export type RatedProduct = { id: string; title: string; storeName: string; rating: number; reviewCount: number };

export type TopProduct = { id: string; title: string; storeName: string; soldCount: number; soldTotal: number };

export type DeliveryPerson = { id: string; name: string; rating: number; deliveredCount: number };

export type TopCustomer = { id: string; name: string; email: string; orderCount: number };

export type StoreLikes = { id: string; storeName: string; likes: number };

export type StoreSales = { id: string; storeName: string; salesTotal: number };
