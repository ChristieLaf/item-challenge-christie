/**
 * List Items Handler
 *
 * Handles GET /api/items
 * Designed for AWS Lambda deployment via API Gateway.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { storage } from "../../storage/store";
import { ListItemsSchema } from "../../types/schemas";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const listItemsHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const query = event.queryStringParameters || {};
    const validated = ListItemsSchema.safeParse(query);

    if (!validated.success) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: validated.error.errors }),
      };
    }

    const result = await storage.listItems(validated.data);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        items: result.items,
        total: result.total,
        limit: validated.data.limit || 10,
        offset: validated.data.offset || 0,
      }),
    };
  } catch (error) {
    console.error("Error listing items:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};