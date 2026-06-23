import { v4 as uuidv4 } from "uuid";
import { SqlQuerySpec } from "@azure/cosmos";
import { getTasksContainer } from "../config/database";
import {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  PaginatedResponse,
  TaskQueryOptions,
} from "../models/task.model";

/**
 * Retrieves a paginated list of tasks with optional filtering, searching, and sorting.
 * Uses parameterized queries to prevent SQL injection.
 */
export async function getTasks(
  options: TaskQueryOptions
): Promise<PaginatedResponse<Task>> {
  const container = getTasksContainer();
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 10;
  const offset = (page - 1) * pageSize;
  const sortBy = options.sortBy ?? "title";
  const sortOrder = options.sortOrder ?? "asc";

  // Build parameterized WHERE clauses
  const conditions: string[] = ["c.organizationId = @organizationId"];
  const parameters: { name: string; value: string }[] = [
    { name: "@organizationId", value: options.organizationId },
  ];

  if (options.status) {
    conditions.push("c.status = @status");
    parameters.push({ name: "@status", value: options.status });
  }

  if (options.priority) {
    conditions.push("c.priority = @priority");
    parameters.push({ name: "@priority", value: options.priority });
  }

  if (options.search) {
    conditions.push(
      "(CONTAINS(LOWER(c.title), LOWER(@search)) OR CONTAINS(LOWER(c.description), LOWER(@search)))"
    );
    parameters.push({ name: "@search", value: options.search });
  }

  const whereClause = conditions.join(" AND ");

  // Whitelist sort fields to prevent injection
  const allowedSortFields: Record<string, string> = {
    title: "c.title",
    status: "c.status",
    priority: "c.priority",
    dueDate: "c.dueDate",
  };
  const sortField = allowedSortFields[sortBy] ?? "c.title";
  const sortDirection = sortOrder === "desc" ? "DESC" : "ASC";

  // Count query for total
  const countQuery: SqlQuerySpec = {
    query: `SELECT VALUE COUNT(1) FROM c WHERE ${whereClause}`,
    parameters,
  };

  const countResult = await container.items.query<number>(countQuery).fetchAll();
  const total = countResult.resources[0] ?? 0;

  // Data query with pagination
  const dataQuery: SqlQuerySpec = {
    query: `SELECT * FROM c WHERE ${whereClause} ORDER BY ${sortField} ${sortDirection} OFFSET @offset LIMIT @limit`,
    parameters: [
      ...parameters,
      { name: "@offset", value: offset as unknown as string },
      { name: "@limit", value: pageSize as unknown as string },
    ],
  };

  const dataResult = await container.items.query<Task>(dataQuery).fetchAll();

  return {
    data: dataResult.resources,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Retrieves a single task by ID and organizationId.
 */
export async function getTask(
  id: string,
  organizationId: string
): Promise<Task> {
  const container = getTasksContainer();
  const { resource } = await container.item(id, organizationId).read<Task>();

  if (!resource) {
    const error = new Error("Task not found") as Error & { code: number };
    error.code = 404;
    throw error;
  }

  return resource;
}

/**
 * Creates a new task with an auto-generated UUID.
 */
export async function createTask(input: CreateTaskInput): Promise<Task> {
  const container = getTasksContainer();
  const task: Task = {
    id: uuidv4(),
    ...input,
  };

  const { resource } = await container.items.create<Task>(task);
  return resource!;
}

/**
 * Updates an existing task using patch operations.
 * Only modifies the fields provided in the input.
 */
export async function updateTask(
  id: string,
  organizationId: string,
  input: UpdateTaskInput
): Promise<Task> {
  const container = getTasksContainer();
  const patchOperations = Object.entries(input).map(([key, value]) => ({
    op: "set" as const,
    path: `/${key}`,
    value,
  }));

  const { resource } = await container
    .item(id, organizationId)
    .patch<Task>(patchOperations);

  return resource!;
}

/**
 * Deletes a single task by ID and organizationId.
 */
export async function deleteTask(
  id: string,
  organizationId: string
): Promise<void> {
  const container = getTasksContainer();
  await container.item(id, organizationId).delete();
}

/**
 * Deletes multiple tasks by their IDs.
 * Uses Promise.all for proper parallel async execution.
 */
export async function bulkDeleteTasks(
  ids: string[],
  organizationId: string
): Promise<void> {
  const container = getTasksContainer();
  await Promise.all(
    ids.map((id) => container.item(id, organizationId).delete())
  );
}
