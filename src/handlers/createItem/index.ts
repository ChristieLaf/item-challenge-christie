/**
 * Create Item Handler
 *
 * Handles POST /api/items
 * Designed for AWS Lambda deployment via API Gateway.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { storage } from "../../storage/store";
import { ItemSchema } from "../../types/schemas";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const createItemHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || "{}");

    const validated = ItemSchema.safeParse(body);

    if (!validated.success) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: validated.error.errors }),
      };
    }

    const item = await storage.createItem(validated.data);

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(item),
    };
  } catch (error) {
    console.error("Error creating item:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};