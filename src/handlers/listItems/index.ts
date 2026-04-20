/**
 * List Items Handler
 *
 * Handles GET /api/items
 * Designed for AWS Lambda deployment via API Gateway.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { storage } from "../../storage/store";
import { ListItemsSchema } from "../../types/schemas";
import { logInfo, logError } from "../../logger/logger";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const listItemsHandler = async (
  event: APIGatewayProxyEvent,
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

    const lastEvaluatedKey = validated.data.cursor
      ? JSON.parse(decodeURIComponent(validated.data.cursor))
      : undefined;

      console.log("LastEvaluatedKey:", JSON.stringify(lastEvaluatedKey));

    const result = await storage.listItems({
      ...validated.data,
      lastEvaluatedKey,
    });

    console.log("LastEvaluatedKey:", JSON.stringify(result.lastEvaluatedKey));

    logInfo("listItemsHandler", "Items listed successfully", {
      total: result.total,
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        items: result.items,
        total: result.total,
        limit: validated.data.limit || 10,
        offset: validated.data.offset || 0,
        ...(result.lastEvaluatedKey && {
          cursor: encodeURIComponent(JSON.stringify(result.lastEvaluatedKey)),
        }),
      }),
    };
  } catch (error) {
    logError("listItemsHandler", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
