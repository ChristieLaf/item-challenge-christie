/**
 * Create Item Handler
 *
 * Handles POST /api/items
 * Designed for AWS Lambda deployment via API Gateway.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { z } from "zod";
import { storage } from "../../storage/store";

const createItemSchema = z.object({
  subject: z.string(),
  itemType: z.enum(["multiple-choice", "free-response", "essay"]),
  difficulty: z.number().min(1).max(5),
  content: z.object({
    question: z.string(),
    options: z.array(z.string()).optional(),
    correctAnswer: z.string(),
    explanation: z.string(),
  }),
  metadata: z.object({
    author: z.string(),
    status: z.enum(["draft", "review", "approved", "archived"]),
    tags: z.array(z.string()),
  }),
  securityLevel: z.enum(["standard", "secure", "highly-secure"]),
});

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

    const validated = createItemSchema.safeParse(body);

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