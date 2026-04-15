/**
 * Get Item Handler
 *
 * Handles GET /api/items/:id
 * Designed for AWS Lambda deployment via API Gateway.
 */

import { storage } from "../../storage/store";

export async function getItemHandler(id: string) {
  try {
    const item = await storage.getItem(id);

    if (!item) {
      return {
        statusCode: 404,
        body: { error: "Item not found" },
      };
    }

    return {
      statusCode: 200,
      body: item,
    };
  } catch (error) {
    console.error("Error getting item:", error);
    return {
      statusCode: 500,
      body: { error: "Internal server error" },
    };
  }
}
