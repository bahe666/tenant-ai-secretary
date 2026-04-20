import { describe, it, expect } from "vitest";
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from "@/lib/utils/api-response";

describe("API 响应工具", () => {
  it("successResponse 返回正确格式", async () => {
    const res = successResponse({ items: [1, 2, 3] });
    const body = await res.json();
    expect(body.code).toBe(0);
    expect(body.message).toBe("success");
    expect(body.data.items).toEqual([1, 2, 3]);
    expect(body.request_id).toBeDefined();
    expect(res.status).toBe(200);
  });

  it("errorResponse 返回正确状态码", async () => {
    const res = errorResponse("参数错误", 400);
    const body = await res.json();
    expect(body.code).toBe(-1);
    expect(body.message).toBe("参数错误");
    expect(body.data).toBeNull();
    expect(res.status).toBe(400);
  });

  it("unauthorizedResponse 返回 401", async () => {
    const res = unauthorizedResponse();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.message).toBe("未认证");
  });

  it("forbiddenResponse 返回 403", async () => {
    const res = forbiddenResponse("无权访问");
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.message).toBe("无权访问");
  });

  it("每个响应都有唯一的 request_id", async () => {
    const r1 = successResponse(null);
    const r2 = successResponse(null);
    const b1 = await r1.json();
    const b2 = await r2.json();
    expect(b1.request_id).not.toBe(b2.request_id);
  });
});
