import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { withErrorHandler } from "../middleware/errorHandler";
import { validateUUID, validateBulkIds } from "../validators/task.validator";
import { bulkDeleteTasks } from "../services/task.service";

/**
 * DELETE /api/tasks/bulk
 * Deletes multiple tasks at once.
 *
 * Query Parameters:
 *   - organizationId (required): UUID of the organization (partition key)
 * Request Body (JSON):
 *   - Array of task ID strings (max 50)
 */
async function BulkDeleteTasksHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("DELETE /api/tasks/bulk");

  const organizationId = request.query.get("organizationId");

  // Validate organizationId
  if (!organizationId) {
    return { status: 400, jsonBody: { error: "organizationId query parameter is required" } };
  }

  const orgError = validateUUID(organizationId, "organizationId");
  if (orgError) {
    return { status: 400, jsonBody: { error: "Validation failed", details: [orgError] } };
  }

  // Validate body (array of IDs)
  const body = await request.json();
  const validation = validateBulkIds(body);
  if (!validation.isValid) {
    return { status: 400, jsonBody: { error: "Validation failed", details: validation.errors } };
  }

  await bulkDeleteTasks(body as string[], organizationId);
  return { status: 204 };
}

app.http("BulkDeleteTasks", {
  methods: ["DELETE"],
  authLevel: "anonymous",
  route: "tasks/bulk",
  handler: withErrorHandler(BulkDeleteTasksHandler),
});
