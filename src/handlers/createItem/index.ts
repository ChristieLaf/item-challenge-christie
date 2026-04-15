/**
 * Create Item Handler
 *
 * Handles POST /api/items
 * Designed for AWS Lambda deployment via API Gateway.
 */

import { z } from 'zod';
import { storage } from '../../storage/store';
import { CreateItemRequest } from '../../types/item';

const createItemSchema = z.object({
  subject: z.string(),
  itemType: z.enum(['multiple-choice', 'free-response', 'essay']),
  difficulty: z.number().min(1).max(5),
  content: z.object({
    question: z.string(),
    options: z.array(z.string()).optional(),
    correctAnswer: z.string(),
    explanation: z.string(),
  }),
  metadata: z.object({
    author: z.string(),
    status: z.enum(['draft', 'review', 'approved', 'archived']),
    tags: z.array(z.string()),
  }),
  securityLevel: z.enum(['standard', 'secure', 'highly-secure']),
});

export async function createItemHandler(data: CreateItemRequest) {
  try {
    const validated = createItemSchema.safeParse(data);

    if (!validated.success) {
      return {
        statusCode: 400,
        body: { error: validated.error.errors },
      };
    }

    const item = await storage.createItem(validated.data);

    return {
      statusCode: 201,
      body: item,
    };
  } catch (error) {
    console.error('Error creating item:', error);
    return {
      statusCode: 500,
      body: { error: 'Internal server error' },
    };
  }
}