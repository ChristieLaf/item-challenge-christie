import { describe, expect, it } from "vitest";
import { createItemHandler } from "../handlers/createItem/index";
import { updateItemHandler } from "../handlers/updateItem/index";

describe("updateItemHandler", () => {
  it("should update an item successfully", async () => {
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
        tags: ["biology"],
      },
      securityLevel: "standard",
    };

    const createResult = await createItemHandler(itemData);
    if (!("id" in createResult.body)) {
      throw new Error("Item creation failed");
    }
    const itemId = createResult.body.id;

    const updateData = {
      difficulty: 5,
      metadata: {
        status: "approved",
      },
    };

    const result = await updateItemHandler(itemId, updateData);

    expect(result.statusCode).toBe(200);
    if ("difficulty" in result.body) {
      expect(result.body.difficulty).toBe(5);
    }
    if ("metadata" in result.body) {
      expect(result.body.metadata).toHaveProperty("status", "approved");
      expect(result.body.metadata).toHaveProperty("version", 2);
    }
  });

  it("should return 404 when item does not exist", async () => {
    const result = await updateItemHandler("non-existent-id", {
      difficulty: 5,
    });

    expect(result.statusCode).toBe(404);
    expect(result.body).toHaveProperty("error");
    if ("error" in result.body) {
      expect(result.body.error).toBe("Item not found");
    }
  });
});
