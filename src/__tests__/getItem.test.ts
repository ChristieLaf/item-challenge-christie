import { APIGatewayProxyEvent } from "aws-lambda";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { getItemHandler } from "../handlers/getItem/index";

vi.mock("../storage/store", () => ({
  storage: {
    getItem: vi.fn(),
  },
}));

import { storage } from "../storage/store";

describe("getItemHandler", () => {
  const createEvent = (id: string): APIGatewayProxyEvent => ({
    body: null,
    headers: {},
    multiValueHeaders: {},
    httpMethod: "GET",
    isBase64Encoded: false,
    path: `/api/items/${id}`,
    pathParameters: { id },
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as any,
    resource: "",
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 404 for non-existent item", async () => {
    (storage.getItem as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const result = await getItemHandler(createEvent("non-existent-id"));
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(404);
    expect(body).toHaveProperty("error");
    expect(body.error).toBe("Item not found");
  });

  it("should retrieve an existing item", async () => {
    const mockItem = {
      id: "123",
      subject: "AP Calculus",
      itemType: "free-response",
      difficulty: 4,
      content: {
        question: "Calculate the derivative...",
        correctAnswer: "42",
        explanation: "Using the chain rule...",
      },
      metadata: {
        author: "test-author",
        status: "approved",
        tags: ["calculus", "derivatives"],
        created: 1234567890,
        lastModified: 1234567890,
        version: 1,
      },
      securityLevel: "standard",
    };

    (storage.getItem as ReturnType<typeof vi.fn>).mockResolvedValue(mockItem);

    const result = await getItemHandler(createEvent("123"));
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(body).toHaveProperty("id", "123");
    expect(body.subject).toBe("AP Calculus");
  });
});
