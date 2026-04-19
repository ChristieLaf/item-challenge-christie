import { describe, expect, it, vi, beforeEach } from "vitest";
import { APIGatewayProxyEvent } from "aws-lambda";
import { listItemsHandler } from "../handlers/listItems/index";

vi.mock("../storage/store", () => ({
  storage: {
    listItems: vi.fn(),
  },
}));

import { storage } from "../storage/store";

describe("listItemsHandler", () => {
  const createEvent = (
    queryStringParameters: Record<string, string> | null = null,
  ): APIGatewayProxyEvent => ({
    body: null,
    headers: {},
    multiValueHeaders: {},
    httpMethod: "GET",
    isBase64Encoded: false,
    path: "/api/items",
    pathParameters: null,
    queryStringParameters,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as any,
    resource: "",
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return a list of items successfully", async () => {
    const mockItems = [
      {
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
          tags: ["biology"],
          created: 1234567890,
          lastModified: 1234567890,
          version: 1,
        },
        securityLevel: "standard",
      },
    ];

    (storage.listItems as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: mockItems,
      total: 1,
    });

    const result = await listItemsHandler(createEvent());
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(body.items).toHaveLength(1);
    expect(body.total).toBe(1);
    expect(body.limit).toBe(10);
    expect(body.offset).toBe(0);
  });

  it("should return an empty list when no items exist", async () => {
    (storage.listItems as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: [],
      total: 0,
    });

    const result = await listItemsHandler(createEvent());
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(body.items).toHaveLength(0);
    expect(body.total).toBe(0);
  });

  it("should return 400 when invalid query parameters are sent", async () => {
    const result = await listItemsHandler(createEvent({ limit: "-1" }));
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(400);
    expect(body).toHaveProperty("error");
  });

  it("should filter items by subject", async () => {
    const mockItems = [
      {
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
          tags: ["biology"],
          created: 1234567890,
          lastModified: 1234567890,
          version: 1,
        },
        securityLevel: "standard",
      },
    ];

    (storage.listItems as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: mockItems,
      total: 1,
    });

    const result = await listItemsHandler(
      createEvent({ subject: "AP Biology" }),
    );
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(body.items).toHaveLength(1);
    expect(body.items[0].subject).toBe("AP Biology");
  });
});
