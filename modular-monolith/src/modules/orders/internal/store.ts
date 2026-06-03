// INTERNAL to the orders module.

export interface OrderRow {
  id: string;
  sku: string;
  qty: number;
  status: "placed" | "rejected";
}

export class OrderStore {
  private readonly rows: OrderRow[] = [];
  add(row: OrderRow) {
    this.rows.push(row);
  }
  all(): OrderRow[] {
    return [...this.rows];
  }
}
