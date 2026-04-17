// 

/**
 * Get Item Handler
 *
 * Handles GET /api/items/:id
 * Designed for AWS Lambda deployment via API Gateway.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { storage } from "../../storage/store";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const getItemHandler = async (
  event: APIGatewayProxyEvent
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

    const item = await storage.getItem(id);

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
    console.error("Error getting item:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};