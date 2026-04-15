/**
 * Update Item Handler
 *
 * Handles PUT /api/items/:id
 * Designed for AWS Lambda deployment via API Gateway.
 */

import { z } from 'zod';
import { storage } from '../../storage/store';
import { UpdateItemRequest } from '../../types/item';

const updateItemSchema = z.object({
  subject: z.string().optional(),
  itemType: z.enum(['multiple-choice', 'free-response', 'essay']).optional(),
  difficulty: z.number().min(1).max(5).optional(),
  content: z.object({
    question: z.string().optional(),
    options: z.array(z.string()).optional(),
    correctAnswer: z.string().optional(),
    explanation: z.string().optional(),
  }).optional(),
  metadata: z.object({
    author: z.string().optional(),
    status: z.enum(['draft', 'review', 'approved', 'archived']).optional(),
    tags: z.array(z.string()).optional(),
  }).optional(),
  securityLevel: z.enum(['standard', 'secure', 'highly-secure']).optional(),
});

export async function updateItemHandler(id: string, data: UpdateItemRequest) {
  try {
    const validated = updateItemSchema.safeParse(data);

    if (!validated.success) {
      return {
        statusCode: 400,
        body: { error: validated.error.errors },
      };
    }

    const item = await storage.updateItem(id, validated.data);

    if (!item) {
      return {
        statusCode: 404,
        body: { error: 'Item not found' },
      };
    }

    return {
      statusCode: 200,
      body: item,
    };
  } catch (error) {
    console.error('Error updating item:', error);
    return {
      statusCode: 500,
      body: { error: 'Internal server error' },
    };
  }
}