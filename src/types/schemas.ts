import { z } from "zod";

export const ItemSchema = z.object({
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

export const UpdateItemSchema = ItemSchema.extend({
  content: ItemSchema.shape.content.partial().optional(),
  metadata: ItemSchema.shape.metadata.partial().optional(),
}).partial();

export const ListItemsSchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
  cursor: z.string().optional(), // lastEvaluatedKey for DynamoDB pagination
  subject: z.string().optional(),
  status: z.enum(["draft", "review", "approved", "archived"]).optional(),
});

// inferred TypeScript types so schema validates and types stay in sync
export type Item = z.infer<typeof ItemSchema>;
export type UpdateItem = z.infer<typeof UpdateItemSchema>;
export type ListItemsQuery = z.infer<typeof ListItemsSchema>;
