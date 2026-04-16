import { describe, expect, it, vi, beforeEach } from "vitest";
import { listItemsHandler } from "../handlers/listItems/index";

vi.mock("../storage/store", () => ({
  storage: {
    listItems: vi.fn(),
  },
}));

import { storage } from "../storage/store";

describe("listItemsHandler", () => {
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
          version: "v1",
        },
        securityLevel: "standard",
      },
    ];

    (storage.listItems as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: mockItems,
      total: 1,
    });

    const result = await listItemsHandler({});

    expect(result.statusCode).toBe(200);
    if ("items" in result.body) {
      expect(result.body.items).toHaveLength(1);
      expect(result.body.total).toBe(1);
      expect(result.body.limit).toBe(10);
      expect(result.body.offset).toBe(0);
    }
  });

  it("should return an empty list when no items exist", async () => {
    (storage.listItems as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: [],
      total: 0,
    });

    const result = await listItemsHandler({});

    expect(result.statusCode).toBe(200);
    if ("items" in result.body) {
      expect(result.body.items).toHaveLength(0);
      expect(result.body.total).toBe(0);
    }
  });

  it("should return 400 when invalid query parameters are sent", async () => {
    const result = await listItemsHandler({
      limit: -1, // invalid, min is 1
    });

    expect(result.statusCode).toBe(400);
    expect(result.body).toHaveProperty("error");
  });
});
