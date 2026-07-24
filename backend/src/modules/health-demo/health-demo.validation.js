// src/modules/health-demo/health-demo.validation.js

const { z } = require('zod');

const ITEM_STATUS = ['ACTIVE', 'ARCHIVED'];

// ============================================================
// LOGIN (Demo)
// ============================================================

/**
 * Login validation schema.
 *
 * Matches the default LOGIN_FLOW body format.
 */
const loginSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email('Invalid email address')
      .min(1, 'Email is required'),
    password: z
      .string()
      .min(1, 'Password is required')
      .max(128),
  })
  .strict();

// ============================================================
// CRUD
// ============================================================

const createItemSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1)
      .max(150),
    description: z
      .string()
      .trim()
      .max(1000)
      .optional(),
    sku: z
      .string()
      .trim()
      .max(100)
      .optional(),
    price: z
      .number()
      .min(0)
      .default(0),
    quantity: z
      .number()
      .int()
      .min(0)
      .default(0),
    status: z
      .enum(ITEM_STATUS)
      .default('ACTIVE'),
    metadata: z
      .record(z.string(), z.any())
      .optional(),
  })
  .strict();

const getItemsSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().optional(),
    status: z.enum(ITEM_STATUS).optional(),
    sortBy: z
      .enum(['createdAt', 'updatedAt', 'name', 'price', 'quantity'])
      .default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  })
  .strict();

const itemIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid item id'),
});

const updateItemSchema = z
  .object({
    name: z.string().trim().min(1).max(150).optional(),
    description: z.string().trim().max(1000).nullable().optional(),
    sku: z.string().trim().max(100).nullable().optional(),
    price: z.number().min(0).optional(),
    quantity: z.number().int().min(0).optional(),
    status: z.enum(ITEM_STATUS).optional(),
    metadata: z.record(z.string(), z.any()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required.',
  });

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  loginSchema,
  createItemSchema,
  getItemsSchema,
  itemIdParamSchema,
  updateItemSchema,
};