import { describe, expect, it, vi, beforeEach } from "vitest";
import { APIGatewayProxyEvent } from "aws-lambda";
import { updateItemHandler } from "../handlers/updateItem/index";

vi.mock("../storage/store", () => ({
  storage: {
    updateItem: vi.fn(),
  },
}));

import { storage } from "../storage/store";

describe("updateItemHandler", () => {
  const createEvent = (id: string, body: any): APIGatewayProxyEvent => ({
    body: JSON.stringify(body),
    headers: {},
    multiValueHeaders: {},
    httpMethod: "PUT",
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

  it("should update an item successfully", async () => {
    const mockUpdatedItem = {
      id: "123",
      subject: "AP Biology",
      itemType: "multiple-choice",
      difficulty: 5,
      content: {
        question: "What is photosynthesis?",
        options: ["A", "B", "C", "D"],
        correctAnswer: "A",
        explanation: "Photosynthesis is the process...",
      },
      metadata: {
        author: "test-author",
        status: "approved",
        tags: ["biology"],
        created: 1234567890,
        lastModified: 1234567891,
        version: 2,
      },
      securityLevel: "standard",
    };

    (storage.updateItem as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockUpdatedItem,
    );

    const result = await updateItemHandler(
      createEvent("123", {
        difficulty: 5,
        metadata: { status: "approved" },
      }),
    );
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(body.difficulty).toBe(5);
    expect(body.metadata).toHaveProperty("status", "approved");
    expect(body.metadata).toHaveProperty("version", 2);
  });

  it("should return 404 when item does not exist", async () => {
    (storage.updateItem as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const result = await updateItemHandler(
      createEvent("non-existent-id", {
        difficulty: 5,
      }),
    );
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(404);
    expect(body).toHaveProperty("error");
    expect(body.error).toBe("Item not found");
  });

  it("should return 400 when invalid data is sent", async () => {
    const result = await updateItemHandler(
      createEvent("123", {
        difficulty: 10, // invalid, max is 5
      }),
    );
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(400);
    expect(body).toHaveProperty("error");
  });

  it("should return 400 when item ID is missing", async () => {
    const result = await updateItemHandler({
      pathParameters: null,
      body: JSON.stringify({ difficulty: 5 }),
      headers: {},
      multiValueHeaders: {},
      httpMethod: "PUT",
      isBase64Encoded: false,
      path: "/api/items/",
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      stageVariables: null,
      requestContext: {} as any,
      resource: "",
    });
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(400);
    expect(body).toHaveProperty("error");
    expect(body.error).toBe("Item ID is required");
  });
});
