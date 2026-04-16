import { describe, expect, it, vi, beforeEach } from "vitest";
import { updateItemHandler } from "../handlers/updateItem/index";

vi.mock("../storage/store", () => ({
  storage: {
    updateItem: vi.fn(),
  },
}));

import { storage } from "../storage/store";

describe("updateItemHandler", () => {
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
        version: "v2",
      },
      securityLevel: "standard",
    };

    (storage.updateItem as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockUpdatedItem,
    );

    const itemId = "123";
    const result = await updateItemHandler(itemId, {
      difficulty: 5,
      metadata: {
        status: "approved",
      },
    });

    expect(result.statusCode).toBe(200);
    if ("difficulty" in result.body) {
      expect(result.body.difficulty).toBe(5);
    }
    if ("metadata" in result.body) {
      expect(result.body.metadata).toHaveProperty("status", "approved");
      expect(result.body.metadata).toHaveProperty("version", "v2");
    }
  });

  it("should return 404 when item does not exist", async () => {
    (storage.updateItem as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const result = await updateItemHandler("non-existent-id", {
      difficulty: 5,
    });

    expect(result.statusCode).toBe(404);
    expect(result.body).toHaveProperty("error");
    if ("error" in result.body) {
      expect(result.body.error).toBe("Item not found");
    }
  });

  it("should return 400 when invalid data is sent", async () => {
    const itemId = "123";
    const result = await updateItemHandler(itemId, {
      difficulty: 10, // invalid, max is 5
    } as any);

    expect(result.statusCode).toBe(400);
    expect(result.body).toHaveProperty("error");
  });
});
