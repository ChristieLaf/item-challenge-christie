import { describe, expect, it, vi, beforeEach } from "vitest";
import { createItemHandler } from "../handlers/createItem/index";

vi.mock("../storage/store", () => ({
  storage: {
    createItem: vi.fn(),
  },
}));

import { storage } from "../storage/store";

describe("createItemHandler", () => {
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
      itemType: "multiple-choice" as const,
      difficulty: 3,
      content: {
        question: "What is photosynthesis?",
        options: ["A", "B", "C", "D"],
        correctAnswer: "A",
        explanation: "Photosynthesis is the process...",
      },
      metadata: {
        author: "test-author",
        status: "draft" as const,
        tags: ["biology", "photosynthesis"],
      },
      securityLevel: "standard" as const,
    };

    const result = await createItemHandler(itemData);

    expect(result.statusCode).toBe(201);
    expect(result.body).toHaveProperty("id");
    if ("subject" in result.body) {
      expect(result.body.subject).toBe("AP Biology");
    }
    if ("metadata" in result.body) {
      expect(result.body.metadata).toHaveProperty("author", "test-author");
    }
  });

  it("should return 400 when required fields are missing", async () => {
    const invalidData = {
      subject: "AP Biology", // missing itemType, difficulty, content, metadata, securityLevel
    };

    const result = await createItemHandler(invalidData as any);

    expect(result.statusCode).toBe(400);
    expect(result.body).toHaveProperty("error");
  });
});
