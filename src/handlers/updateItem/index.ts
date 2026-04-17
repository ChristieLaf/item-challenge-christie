/**
 * Update Item Handler
 *
 * Handles PUT /api/items/:id
 * Designed for AWS Lambda deployment via API Gateway.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { z } from "zod";
import { storage } from "../../storage/store";

const updateItemSchema = z.object({
  subject: z.string().optional(),
  itemType: z.enum(["multiple-choice", "free-response", "essay"]).optional(),
  difficulty: z.number().min(1).max(5).optional(),
  content: z
    .object({
      question: z.string().optional(),
      options: z.array(z.string()).optional(),
      correctAnswer: z.string().optional(),
      explanation: z.string().optional(),
    })
    .optional(),
  metadata: z
    .object({
      author: z.string().optional(),
      status: z.enum(["draft", "review", "approved", "archived"]).optional(),
      tags: z.array(z.string()).optional(),
    })
    .optional(),
  securityLevel: z.enum(["standard", "secure", "highly-secure"]).optional(),
});

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const updateItemHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const id = event.pathParameters?.id;

    if (!id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Item ID is required" }),
      };
    }

    const data = JSON.parse(event.body || "{}");
    const validated = updateItemSchema.safeParse(data);

    if (!validated.success) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: validated.error.errors }),
      };
    }

    const item = await storage.updateItem(id, validated.data);

    if (!item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: "Item not found" }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(item),
    };
  } catch (error) {
    console.error("Error updating item:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
