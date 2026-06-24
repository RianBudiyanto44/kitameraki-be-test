import { CreateTaskInput, UpdateTaskInput, TaskStatus, TaskPriority } from "../models/task.model";

/**
 * Validation error structure.
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validation result.
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_STATUSES = Object.values(TaskStatus);
const VALID_PRIORITIES = Object.values(TaskPriority);
const VALID_SORT_FIELDS = ["title", "status", "priority", "dueDate"];

/**
 * Validates a UUID string.
 */
export function validateUUID(value: string, fieldName: string): ValidationError | null {
  if (!UUID_REGEX.test(value)) {
    return { field: fieldName, message: `${fieldName} must be a valid UUID` };
  }
  return null;
}

/**
 * Validates input for creating a new task.
 */
export function validateCreateTask(input: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (!input || typeof input !== "object") {
    return { isValid: false, errors: [{ field: "body", message: "Request body must be a JSON object" }] };
  }

  const body = input as Record<string, unknown>;

  // Required: organizationId
  if (!body.organizationId || typeof body.organizationId !== "string") {
    errors.push({ field: "organizationId", message: "organizationId is required and must be a string" });
  } else {
    const uuidError = validateUUID(body.organizationId, "organizationId");
    if (uuidError) errors.push(uuidError);
  }

  // Required: title
  if (!body.title || typeof body.title !== "string") {
    errors.push({ field: "title", message: "title is required and must be a string" });
  } else if (body.title.length > 100) {
    errors.push({ field: "title", message: "title must be at most 100 characters" });
  }

  // Required: status
  if (!body.status || typeof body.status !== "string") {
    errors.push({ field: "status", message: "status is required and must be a string" });
  } else if (!VALID_STATUSES.includes(body.status as TaskStatus)) {
    errors.push({ field: "status", message: `status must be one of: ${VALID_STATUSES.join(", ")}` });
  }

  // Optional: description
  if (body.description !== undefined) {
    if (typeof body.description !== "string") {
      errors.push({ field: "description", message: "description must be a string" });
    } else if (body.description.length > 1000) {
      errors.push({ field: "description", message: "description must be at most 1000 characters" });
    }
  }

  // Optional: dueDate
  if (body.dueDate !== undefined) {
    if (typeof body.dueDate !== "string" || isNaN(Date.parse(body.dueDate))) {
      errors.push({ field: "dueDate", message: "dueDate must be a valid ISO 8601 date-time string" });
    }
  }

  // Optional: priority
  if (body.priority !== undefined) {
    if (typeof body.priority !== "string" || !VALID_PRIORITIES.includes(body.priority as TaskPriority)) {
      errors.push({ field: "priority", message: `priority must be one of: ${VALID_PRIORITIES.join(", ")}` });
    }
  }

  // Optional: tags
  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags)) {
      errors.push({ field: "tags", message: "tags must be an array of strings" });
    } else {
      for (let i = 0; i < body.tags.length; i++) {
        if (typeof body.tags[i] !== "string") {
          errors.push({ field: `tags[${i}]`, message: "each tag must be a string" });
        } else if ((body.tags[i] as string).length > 50) {
          errors.push({ field: `tags[${i}]`, message: "each tag must be at most 50 characters" });
        }
      }
    }
  }

  // Optional: customFields
  if (body.customFields !== undefined) {
    if (typeof body.customFields !== "object" || body.customFields === null || Array.isArray(body.customFields)) {
      errors.push({ field: "customFields", message: "customFields must be a JSON object" });
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validates input for updating an existing task.
 * Prevents modification of id and organizationId.
 */
export function validateUpdateTask(input: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (!input || typeof input !== "object") {
    return { isValid: false, errors: [{ field: "body", message: "Request body must be a JSON object" }] };
  }

  const body = input as Record<string, unknown>;

  // Prevent modification of immutable fields
  if ("id" in body) {
    errors.push({ field: "id", message: "id cannot be modified" });
  }
  if ("organizationId" in body) {
    errors.push({ field: "organizationId", message: "organizationId cannot be modified" });
  }

  // Must have at least one field to update
  const allowedFields = ["title", "description", "dueDate", "priority", "status", "tags", "customFields"];
  const updateFields = Object.keys(body).filter((key) => allowedFields.includes(key));
  if (updateFields.length === 0) {
    errors.push({ field: "body", message: "At least one field must be provided for update" });
  }

  // Optional: title
  if (body.title !== undefined) {
    if (typeof body.title !== "string" || body.title.length === 0) {
      errors.push({ field: "title", message: "title must be a non-empty string" });
    } else if (body.title.length > 100) {
      errors.push({ field: "title", message: "title must be at most 100 characters" });
    }
  }

  // Optional: description
  if (body.description !== undefined) {
    if (typeof body.description !== "string") {
      errors.push({ field: "description", message: "description must be a string" });
    } else if (body.description.length > 1000) {
      errors.push({ field: "description", message: "description must be at most 1000 characters" });
    }
  }

  // Optional: dueDate
  if (body.dueDate !== undefined) {
    if (typeof body.dueDate !== "string" || isNaN(Date.parse(body.dueDate))) {
      errors.push({ field: "dueDate", message: "dueDate must be a valid ISO 8601 date-time string" });
    }
  }

  // Optional: priority
  if (body.priority !== undefined) {
    if (typeof body.priority !== "string" || !VALID_PRIORITIES.includes(body.priority as TaskPriority)) {
      errors.push({ field: "priority", message: `priority must be one of: ${VALID_PRIORITIES.join(", ")}` });
    }
  }

  // Optional: status
  if (body.status !== undefined) {
    if (typeof body.status !== "string" || !VALID_STATUSES.includes(body.status as TaskStatus)) {
      errors.push({ field: "status", message: `status must be one of: ${VALID_STATUSES.join(", ")}` });
    }
  }

  // Optional: tags
  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags)) {
      errors.push({ field: "tags", message: "tags must be an array of strings" });
    } else {
      for (let i = 0; i < body.tags.length; i++) {
        if (typeof body.tags[i] !== "string") {
          errors.push({ field: `tags[${i}]`, message: "each tag must be a string" });
        } else if ((body.tags[i] as string).length > 50) {
          errors.push({ field: `tags[${i}]`, message: "each tag must be at most 50 characters" });
        }
      }
    }
  }

  // Optional: customFields
  if (body.customFields !== undefined) {
    if (typeof body.customFields !== "object" || body.customFields === null || Array.isArray(body.customFields)) {
      errors.push({ field: "customFields", message: "customFields must be a JSON object" });
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validates query options for listing tasks.
 */
export function validateQueryOptions(params: Record<string, string | null>): ValidationResult {
  const errors: ValidationError[] = [];

  if (!params.organizationId) {
    errors.push({ field: "organizationId", message: "organizationId query parameter is required" });
  } else {
    const uuidError = validateUUID(params.organizationId, "organizationId");
    if (uuidError) errors.push(uuidError);
  }

  if (params.page !== undefined && params.page !== null) {
    const page = parseInt(params.page, 10);
    if (isNaN(page) || page < 1) {
      errors.push({ field: "page", message: "page must be a positive integer" });
    }
  }

  if (params.pageSize !== undefined && params.pageSize !== null) {
    const pageSize = parseInt(params.pageSize, 10);
    if (isNaN(pageSize) || pageSize < 1 || pageSize > 100) {
      errors.push({ field: "pageSize", message: "pageSize must be an integer between 1 and 100" });
    }
  }

  if (params.status !== undefined && params.status !== null) {
    if (!VALID_STATUSES.includes(params.status as TaskStatus)) {
      errors.push({ field: "status", message: `status must be one of: ${VALID_STATUSES.join(", ")}` });
    }
  }

  if (params.priority !== undefined && params.priority !== null) {
    if (!VALID_PRIORITIES.includes(params.priority as TaskPriority)) {
      errors.push({ field: "priority", message: `priority must be one of: ${VALID_PRIORITIES.join(", ")}` });
    }
  }

  if (params.sortBy !== undefined && params.sortBy !== null) {
    if (!VALID_SORT_FIELDS.includes(params.sortBy)) {
      errors.push({ field: "sortBy", message: `sortBy must be one of: ${VALID_SORT_FIELDS.join(", ")}` });
    }
  }

  if (params.sortOrder !== undefined && params.sortOrder !== null) {
    if (!["asc", "desc"].includes(params.sortOrder)) {
      errors.push({ field: "sortOrder", message: "sortOrder must be 'asc' or 'desc'" });
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validates an array of task IDs for bulk operations.
 */
export function validateBulkIds(input: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (!Array.isArray(input)) {
    return { isValid: false, errors: [{ field: "body", message: "Request body must be an array of task IDs" }] };
  }

  if (input.length === 0) {
    errors.push({ field: "body", message: "At least one task ID must be provided" });
  }

  if (input.length > 50) {
    errors.push({ field: "body", message: "Cannot delete more than 50 tasks at once" });
  }

  for (let i = 0; i < input.length; i++) {
    if (typeof input[i] !== "string") {
      errors.push({ field: `ids[${i}]`, message: "each ID must be a string" });
    } else {
      const uuidError = validateUUID(input[i] as string, `ids[${i}]`);
      if (uuidError) errors.push(uuidError);
    }
  }

  return { isValid: errors.length === 0, errors };
}
