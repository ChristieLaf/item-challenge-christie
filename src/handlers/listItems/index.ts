/**
 * List Items Handler
 *
 * Handles GET /api/items
 * Designed for AWS Lambda deployment via API Gateway.
 */

import { z } from 'zod';
import { storage } from '../../storage/store';
import { ListItemsQuery } from '../../types/item';

const listItemsSchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
  subject: z.string().optional(),
  status: z.enum(['draft', 'review', 'approved', 'archived']).optional(),
});

export async function listItemsHandler(query: ListItemsQuery) {
  try {
    const validated = listItemsSchema.safeParse(query);

    if (!validated.success) {
      return {
        statusCode: 400,
        body: { error: validated.error.errors },
      };
    }

    const result = await storage.listItems(validated.data);

    return {
      statusCode: 200,
      body: {
        items: result.items,
        total: result.total,
        limit: validated.data.limit || 10,
        offset: validated.data.offset || 0,
      },
    };
  } catch (error) {
    console.error('Error listing items:', error);
    return {
      statusCode: 500,
      body: { error: 'Internal server error' },
    };
  }
}