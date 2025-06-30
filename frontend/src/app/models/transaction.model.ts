export interface Transaction {
  id: string;
  type_transaction: string; // o enum si lo tienes
  value_transaction: number;
  date_create: string; // o Date
  date_update: string; // o Date
  operation_id?: string;
  status: string; // o enum si lo tienes
}