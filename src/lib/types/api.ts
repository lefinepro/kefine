export interface ApiMeta {
  requestId: string;
  timestamp: string;
}

export interface ApiResponse<T> {
  data: T;
  meta: ApiMeta;
}

export interface ListMeta extends ApiMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ListLinks {
  self: string;
  first: string;
  last: string;
  next?: string;
  prev?: string;
}

export interface ListResponse<T> {
  data: T[];
  meta: ListMeta;
  links?: ListLinks;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface ApiErrorResponse {
  error: ApiErrorDetail;
  meta: ApiMeta;
}
