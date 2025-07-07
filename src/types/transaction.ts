export interface TransactionDto {
  id: number;
  type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  description?: string | null;
  created_at: string;
}

export interface TransactionsListResponse {
  transactions: TransactionDto[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
