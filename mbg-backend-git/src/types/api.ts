export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface ApiError {
  error: string;
  details?: string;
  message?: string;
}

export interface SearchOption {
  value: string;
  label: string;
  description?: string;
}
