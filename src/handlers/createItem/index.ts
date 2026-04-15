/**
 * Create Item Handler
 *
 * Handles POST /api/items
 * Designed for AWS Lambda deployment via API Gateway.
 */

import { storage } from "../../storage/store";
import { CreateItemRequest } from "../../types/item";

export async function createItemHandler(data: CreateItemRequest) {
  try {
    // TODO: Add validation using Zod
    const item = await storage.createItem(data);

    return {
      statusCode: 201,
      body: item,
    };
  } catch (error) {
    console.error("Error creating item:", error);
    return {
      statusCode: 500,
      body: { error: "Internal server error" },
    };
  }
}
