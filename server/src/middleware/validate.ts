import { Request, Response, NextFunction } from 'express';

export interface FieldSchema {
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  enum?: (string | number)[];
  pattern?: RegExp;
}

export type Schema = Record<string, FieldSchema>;

/**
 * Validates req.body against a simple schema.
 * Returns 400 with detailed field errors if validation fails.
 *
 * Usage:
 *   router.post('/endpoint', validateBody({
 *     lat: { type: 'number', required: true, min: -90, max: 90 },
 *     name: { type: 'string', required: true, minLength: 2, maxLength: 100 },
 *   }), handler);
 */
export function validateBody(schema: Schema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: Record<string, string> = {};
    const body = req.body as Record<string, unknown>;

    for (const [field, rules] of Object.entries(schema)) {
      const value = body[field];
      const isEmpty =
        value === undefined || value === null || value === '';

      // Required check
      if (rules.required && isEmpty) {
        errors[field] = `${field} is required`;
        continue;
      }

      // Skip further checks if field is absent and not required
      if (isEmpty) continue;

      // Type check
      if (rules.type) {
        if (rules.type === 'array') {
          if (!Array.isArray(value)) {
            errors[field] = `${field} must be an array`;
            continue;
          }
        } else if (rules.type === 'number') {
          const num = Number(value);
          if (isNaN(num)) {
            errors[field] = `${field} must be a number`;
            continue;
          }
          // Range check for numbers
          if (rules.min !== undefined && num < rules.min) {
            errors[field] = `${field} must be >= ${rules.min}`;
            continue;
          }
          if (rules.max !== undefined && num > rules.max) {
            errors[field] = `${field} must be <= ${rules.max}`;
            continue;
          }
        } else if (typeof value !== rules.type) {
          errors[field] = `${field} must be of type ${rules.type}`;
          continue;
        }
      }

      // String-specific checks
      if (rules.type === 'string' && typeof value === 'string') {
        if (rules.minLength !== undefined && value.length < rules.minLength) {
          errors[field] = `${field} must be at least ${rules.minLength} characters`;
          continue;
        }
        if (rules.maxLength !== undefined && value.length > rules.maxLength) {
          errors[field] = `${field} must be at most ${rules.maxLength} characters`;
          continue;
        }
        if (rules.pattern && !rules.pattern.test(value)) {
          errors[field] = `${field} has an invalid format`;
          continue;
        }
      }

      // Enum check
      if (rules.enum && !rules.enum.includes(value as string | number)) {
        errors[field] = `${field} must be one of: ${rules.enum.join(', ')}`;
      }
    }

    if (Object.keys(errors).length > 0) {
      res.status(400).json({ error: 'Validation failed', details: errors });
      return;
    }

    next();
  };
}
