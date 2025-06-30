export interface Transaction {
  id: number;
  type_transaction: string; 
  value_transaction: number;
  date_create: string; // o Date
  date_update: string; // o Date
  operation_id?: string;
  status: string; // o enum
}