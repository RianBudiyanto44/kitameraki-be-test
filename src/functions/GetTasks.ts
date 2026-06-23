import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { withErrorHandler } from "../middleware/errorHandler";
import { validateQueryOptions } from "../validators/task.validator";
import { getTasks } from "../services/task.service";
import { TaskStatus, TaskPriority } from "../models/task.model";

/**
 * GET /api/tasks
 * Returns a paginated list of tasks with optional filtering, searching, and sorting.
 *
 * Query Parameters:
 *   - organizationId (required): UUID of the organization
 *   - page (optional, default: 1): Page number
 *   - pageSize (optional, default: 10): Items per page (max: 100)
 *   - search (optional): Search term for title/description
 *   - status (optional): Filter by status (todo, in-progress, completed)
 *   - priority (optional): Filter by priority (low, medium, high)
 *   - sortBy (optional, default: title): Sort field (title, status, priority, dueDate)
 *   - sortOrder (optional, default: asc): Sort direction (asc, desc)
 */
async function GetTasksHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log(`GET /api/tasks — ${request.url}`);

  const queryParams = {
    organizationId: request.query.get("organizationId"),
    page: request.query.get("page"),
    pageSize: request.query.get("pageSize"),
    search: request.query.get("search"),
    status: request.query.get("status"),
    priority: request.query.get("priority"),
    sortBy: request.query.get("sortBy"),
    sortOrder: request.query.get("sortOrder"),
  };

  // Validate query parameters
  const validation = validateQueryOptions(queryParams);
  if (!validation.isValid) {
    return { status: 400, jsonBody: { error: "Validation failed", details: validation.errors } };
  }

  const result = await getTasks({
    organizationId: queryParams.organizationId!,
    page: queryParams.page ? parseInt(queryParams.page, 10) : undefined,
    pageSize: queryParams.pageSize ? parseInt(queryParams.pageSize, 10) : undefined,
    search: queryParams.search ?? undefined,
    status: (queryParams.status as TaskStatus) ?? undefined,
    priority: (queryParams.priority as TaskPriority) ?? undefined,
    sortBy: queryParams.sortBy ?? undefined,
    sortOrder: (queryParams.sortOrder as "asc" | "desc") ?? undefined,
  });

  return { status: 200, jsonBody: result };
}

app.http("GetTasks", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "tasks",
  handler: withErrorHandler(GetTasksHandler),
});
