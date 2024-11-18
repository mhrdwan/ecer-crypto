export interface TransactionDetails {
    order_id: string;
    gross_amount: number;
  }
  
  export interface ItemDetails {
    id: string;
    price: number;
    quantity: number;
    name: string;
  }
  
  export interface CustomerDetails {
    first_name: string;
    last_name?: string;
    email: string;
    phone?: string;
  }
  