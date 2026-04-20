import { NextResponse } from "next/server";

interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T | null;
  request_id: string;
}

export function successResponse<T>(data: T, message = "success"): NextResponse {
  const body: ApiResponse<T> = {
    code: 0,
    message,
    data,
    request_id: crypto.randomUUID(),
  };
  return NextResponse.json(body);
}

export function errorResponse(
  message: string,
  status: number = 400,
  code: number = -1
): NextResponse {
  const body: ApiResponse = {
    code,
    message,
    data: null,
    request_id: crypto.randomUUID(),
  };
  return NextResponse.json(body, { status });
}

export function unauthorizedResponse(message = "未认证"): NextResponse {
  return errorResponse(message, 401, 401);
}

export function forbiddenResponse(message = "权限不足"): NextResponse {
  return errorResponse(message, 403, 403);
}

export function notFoundResponse(message = "资源不存在"): NextResponse {
  return errorResponse(message, 404, 404);
}

export function rateLimitResponse(): NextResponse {
  const body: ApiResponse = {
    code: 429,
    message: "请求过于频繁，请稍后重试",
    data: null,
    request_id: crypto.randomUUID(),
  };
  const response = NextResponse.json(body, { status: 429 });
  response.headers.set("Retry-After", "60");
  return response;
}
