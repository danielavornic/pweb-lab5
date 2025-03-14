export interface HttpResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

export interface HttpRequestOptions {
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  path?: string;
  preferredFormat?: ContentFormat;
}

export type ContentFormat = "html" | "json";
