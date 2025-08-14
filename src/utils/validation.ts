import { ReadableByteStreamControllerCallback } from "stream/web";
import { SwiftRequest, SwiftResponse } from "../types";
import { parseLimit } from "./helpers";

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  sanitised?: any;
}

/**
 * Field validation rule interface
 */
export interface ValidationRule {
  required?: boolean;
  type?: "string" | "number" | "boolean" | "email" | "url" | "array" | "object";
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: any[];
  custom?: (value: any) => boolean | string;
  sanitise?: (value: any) => any;
}

/**
 * Schema validation interface
 */
export interface ValidationSchema {
  [key: string]: ValidationRule;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return RegExp(/^[^\s@]+@[^\s@]+\.[^\s@]+$/).test(email);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitise string (trim and escape HTML)
 */
export function sanitiseString(value: string): string {
  return value
    .trim()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27");
}

/**
 * Sanitise string (trim and escape HTML) (American this time)
 */
export function sanitizeString(value: string): string {
  return sanitiseString(value);
}

/**
 * Validate string type
 */
function validateStringType(
  value: any,
  rule: ValidationRule,
  fieldName: string
): { errors: string[]; sanitised: any } {
  if (typeof value !== "string") {
    return { errors: [`${fieldName} must be a string`], sanitised: value };
  }

  const sanitised = rule.sanitise
    ? rule.sanitise(value)
    : sanitiseString(value);
  return { errors: [], sanitised };
}

/**
 * Validate number type
 */
function validateNumberType(
  value: any,
  fieldName: string
): { errors: string[]; sanitised: any } {
  const num = Number(value);
  if (isNaN(num)) {
    return { errors: [`${fieldName} must be a number`], sanitised: value };
  }
  return { errors: [], sanitised: num };
}

/**
 * Validate boolean type
 */
function validateBooleanType(
  value: any,
  fieldName: string
): { errors: string[]; sanitised: any } {
  if (typeof value === "boolean") {
    return { errors: [], sanitised: value };
  }

  if (value === "true" || value === "1") {
    return { errors: [], sanitised: true };
  }

  if (value === "false" || value === "0") {
    return { errors: [], sanitised: false };
  }

  return { errors: [`${fieldName} must be a boolean`], sanitised: value };
}

/**
 * Validate email type
 */
function validateEmailType(
  value: any,
  fieldName: string
): { errors: string[]; sanitised: any } {
  if (typeof value !== "string" || !isValidEmail(value)) {
    return { errors: [`${fieldName} must be a valid email`], sanitised: value };
  }
  return { errors: [], sanitised: value.toLowerCase().trim() };
}

/**
 * Validate URL type
 */
function validateUrlType(
  value: any,
  fieldName: string
): { errors: string[]; sanitised: any } {
  if (typeof value !== "string" || !isValidUrl(value)) {
    return { errors: [`${fieldName} must be a valid URL`], sanitised: value };
  }
  return { errors: [], sanitised: value };
}

/**
 * Validate array type
 */
function validateArrayType(
  value: any,
  fieldName: string
): { errors: string[]; sanitised: any } {
  if (!Array.isArray(value)) {
    return { errors: [`${fieldName} must be an array`], sanitised: value };
  }
  return { errors: [], sanitised: value };
}

/**
 * Validate object type
 */
function validateObjectType(
  value: any,
  fieldName: string
): { errors: string[]; sanitised: any } {
  if (typeof value !== "object" || Array.isArray(value) || value === null) {
    return { errors: [`${fieldName} must be an object`], sanitised: value };
  }
  return { errors: [], sanitised: value };
}

/**
 * Validate type and return sanitised value
 */
function validateType(
  value: any,
  rule: ValidationRule,
  fieldName: string
): { errors: string[]; sanitised: any } {
  if (!rule.type) {
    return { errors: [], sanitised: value };
  }

  switch (rule.type) {
    case "string":
      return validateStringType(value, rule, fieldName);
    case "number":
      return validateNumberType(value, fieldName);
    case "boolean":
      return validateBooleanType(value, fieldName);
    case "email":
      return validateEmailType(value, fieldName);
    case "url":
      return validateUrlType(value, fieldName);
    case "array":
      return validateArrayType(value, fieldName);
    case "object":
      return validateObjectType(value, fieldName);
    default:
      return { errors: [], sanitised: value };
  }
}

/**
 * Validate min constraint
 */
function validateMin(
  value: any,
  min: number,
  fieldName: string
): string | null {
  if (typeof value === "string" && value.length < min) {
    return `${fieldName} must be at least ${min} characters long`;
  }
  if (typeof value === "number" && value < min) {
    return `${fieldName} must be at least ${min}`;
  }
  if (Array.isArray(value) && value.length < min) {
    return `${fieldName} must have at least ${min} items`;
  }
  return null;
}

/**
 * Validate max constraint
 */
function validateMax(
  value: any,
  max: number,
  fieldName: string
): string | null {
  if (typeof value === "string" && value.length > max) {
    return `${fieldName} must be at most ${max} characters long`;
  }
  if (typeof value === "number" && value > max) {
    return `${fieldName} must be at most ${max}`;
  }
  if (Array.isArray(value) && value.length > max) {
    return `${fieldName} must have at most ${max} items`;
  }
  return null;
}

/**
 * Validate min/max constraints
 */
function validateMinMax(
  value: any,
  rule: ValidationRule,
  fieldName: string
): string[] {
  const errors: string[] = [];

  if (rule.min !== undefined) {
    const minError = validateMin(value, rule.min, fieldName);
    if (minError) errors.push(minError);
  }

  if (rule.max !== undefined) {
    const maxError = validateMax(value, rule.max, fieldName);
    if (maxError) errors.push(maxError);
  }

  return errors;
}

/**
 * Validate pattern constraint
 */
function validatePattern(
  value: any,
  rule: ValidationRule,
  fieldName: string
): string[] {
  if (rule.pattern && typeof value === "string" && !rule.pattern.test(value)) {
    return [`${fieldName} format is invalid`];
  }
  return [];
}

/**
 * Validate enum constraint
 */
function validateEnum(
  value: any,
  rule: ValidationRule,
  fieldName: string
): string[] {
  if (rule.enum && !rule.enum.includes(value)) {
    return [`${fieldName} must be one of: ${rule.enum.join(", ")}`];
  }
  return [];
}

/**
 * Validate custom constraint
 */
function validateCustom(
  value: any,
  rule: ValidationRule,
  fieldName: string
): string[] {
  if (!rule.custom) {
    return [];
  }

  const customResult = rule.custom(value);
  if (customResult !== true) {
    const errorMessage =
      typeof customResult === "string"
        ? customResult
        : `${fieldName} is invalid`;
    return [errorMessage];
  }
  return [];
}

/**
 * Check if value is empty
 */
function isEmpty(value: any): boolean {
  return value === undefined || value === null || value === "";
}

/**
 * Validate a single field against a rule
 */
export function validateField(
  value: any,
  rule: ValidationRule,
  fieldName: string
): ValidationResult {
  // Check required
  if (rule.required && isEmpty(value)) {
    return { valid: false, errors: [`${fieldName} is required`] };
  }

  // Skip other validations if value is empty and not required
  if (isEmpty(value)) {
    return { valid: true, errors: [], sanitised: value };
  }

  // Type validation and sanitisation
  const typeResult = validateType(value, rule, fieldName);
  if (typeResult.errors.length > 0) {
    return {
      valid: false,
      errors: typeResult.errors,
      sanitised: typeResult.sanitised,
    };
  }

  const sanitised = typeResult.sanitised;
  const errors: string[] = [];

  // All other validations
  errors.push(...validateMinMax(sanitised, rule, fieldName));
  errors.push(...validatePattern(sanitised, rule, fieldName));
  errors.push(...validateEnum(sanitised, rule, fieldName));
  errors.push(...validateCustom(sanitised, rule, fieldName));

  return {
    valid: errors.length === 0,
    errors,
    sanitised,
  };
}

/**
 * Validate object against schema
 */
export function validateSchema(
  data: any,
  schema: ValidationSchema
): ValidationResult {
  const errors: string[] = [];
  const sanitised: any = {};

  // validate each field in schema (so boring ik)
  for (const [fieldName, rule] of Object.entries(schema)) {
    const fieldResult: ValidationResult = validateField(
      data[fieldName],
      rule,
      fieldName
    );

    if (!fieldResult.valid) {
      errors.push(...fieldResult.errors);
    } else {
      sanitised[fieldName] = fieldResult.sanitised;
    }
  }
  return {
    valid: errors.length === 0,
    errors,
    sanitised,
  };
}

/**
 * Middleware factory for request validation
 */
export function validate(
  schema: ValidationSchema,
  target: "body" | "query" | "params" = "body"
) {
  return (req: SwiftRequest, res: any, next: () => void) => {
    let dataToValidate;
    if (target === "body") {
      dataToValidate = req.body;
    } else if (target === "query") {
      dataToValidate = req.query;
    } else {
      dataToValidate = req.params;
    }
    const result = validateSchema(dataToValidate, schema);

    if (!result.valid) {
      return res.status(400).json({
        error: "Validation failed",
        details: result.errors,
      });
    }

    if (target === "body") {
      req.body = result.sanitised;
    } else if (target === "query") {
      req.query = result.sanitised;
    } else {
      req.params = result.sanitised;
    }
    next();
  };
}

/**
 * Common validation schemas
 */
export const commonSchemas: { [key: string]: ValidationSchema } = {
  // User registration
  userRegistration: {
    email: { required: true, type: "email" as const },
    password: { required: true, type: "string" as const, min: 8, max: 128 },
    name: { required: true, type: "string" as const, min: 2, max: 50 },
    age: { type: "number" as const, min: 13, max: 120 },
  },

  // User login
  userLogin: {
    email: { required: true, type: "email" as const },
    password: { required: true, type: "string" as const },
  },

  // Pagination
  pagination: {
    page: { type: "number" as const, min: 1 },
    limit: { type: "number" as const, min: 1, max: 100 },
    sort: { type: "string" as const, enum: ["asc", "desc"] },
  },

  // ID parameter
  idParam: {
    id: {
      required: true,
      type: "string" as const,
      pattern: /^[a-zA-Z0-9_-]+$/,
    },
  },
};

/**
 * Request size validation
 */
export function validateRequestSize(maxSize: string = "10mb") {
  return (req: SwiftRequest, res: SwiftResponse, next: () => void) => {
    const contentLength: number = parseInt(
      req.headers["content-length"] || "0",
      10
    );

    try {
      const maxBytes = parseLimit(maxSize);

      if (contentLength > maxBytes) {
        return res.status(413).json({
          error: "Request entity too large",
          maxSize,
          receivedSize: contentLength,
        });
      }
      next();
    } catch (error) {
      return res.status(500).json({
        error: "Invalid max size configuration",
        details: (error as Error).message,
      });
    }
  };
}
