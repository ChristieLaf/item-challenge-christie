import { describe, expect, it, vi, beforeEach } from "vitest";
import { getItemHandler } from "../handlers/getItem/index";

vi.mock("../storage/store", () => ({
  storage: {
    getItem: vi.fn(),
  },
}));

import { storage } from "../storage/store";

describe("getItemHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 404 for non-existent item", async () => {
    (storage.getItem as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const result = await getItemHandler("non-existent-id");

    expect(result.statusCode).toBe(404);
    expect(result.body).toHaveProperty("error");
    if ("error" in result.body) {
      expect(result.body.error).toBe("Item not found");
    }
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
        version: "v1",
      },
      securityLevel: "standard",
    };

    (storage.getItem as ReturnType<typeof vi.fn>).mockResolvedValue(mockItem);

    const result = await getItemHandler("123");

    expect(result.statusCode).toBe(200);
    expect(result.body).toHaveProperty("id", "123");
    if ("subject" in result.body) {
      expect(result.body.subject).toBe("AP Calculus");
    }
  });
});
