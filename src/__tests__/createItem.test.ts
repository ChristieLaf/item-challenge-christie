import { describe, expect, it, vi, beforeEach } from "vitest";
import { APIGatewayProxyEvent } from "aws-lambda";
import { createItemHandler } from "../handlers/createItem/index";

vi.mock("../storage/store", () => ({
  storage: {
    createItem: vi.fn(),
  },
}));

import { storage } from "../storage/store";

describe("createItemHandler", () => {
  const createEvent = (body: any): APIGatewayProxyEvent => ({
    body: JSON.stringify(body),
    headers: {},
    multiValueHeaders: {},
    httpMethod: "POST",
    isBase64Encoded: false,
    path: "/api/items",
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as any,
    resource: "",
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create an item successfully", async () => {
    const mockItem = {
      id: "123",
      subject: "AP Biology",
      itemType: "multiple-choice",
      difficulty: 3,
      content: {
        question: "What is photosynthesis?",
        options: ["A", "B", "C", "D"],
        correctAnswer: "A",
        explanation: "Photosynthesis is the process...",
      },
      metadata: {
        author: "test-author",
        status: "draft",
        tags: ["biology", "photosynthesis"],
        created: 1234567890,
        lastModified: 1234567890,
        version: "v1",
      },
      securityLevel: "standard",
    };

    (storage.createItem as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockItem,
    );

    const itemData = {
      subject: "AP Biology",
      itemType: "multiple-choice",
      difficulty: 3,
      content: {
        question: "What is photosynthesis?",
        options: ["A", "B", "C", "D"],
        correctAnswer: "A",
        explanation: "Photosynthesis is the process...",
      },
      metadata: {
        author: "test-author",
        status: "draft",
        tags: ["biology", "photosynthesis"],
      },
      securityLevel: "standard",
    };

    const result = await createItemHandler(createEvent(itemData));
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(201);
    expect(body).toHaveProperty("id");
    expect(body.subject).toBe("AP Biology");
    expect(body.metadata).toHaveProperty("author", "test-author");
  });

  it("should return 400 when required fields are missing", async () => {
    const invalidData = {
      subject: "AP Biology", // missing itemType, difficulty, content, metadata, securityLevel
    };

    const result = await createItemHandler(createEvent(invalidData));
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(400);
    expect(body).toHaveProperty("error");
  });
});
