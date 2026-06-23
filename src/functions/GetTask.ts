import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { withErrorHandler } from "../middleware/errorHandler";
import { validateUUID } from "../validators/task.validator";
import { getTask } from "../services/task.service";

/**
 * GET /api/tasks/{id}
 * Returns a single task by its ID.
 *
 * Route Parameters:
 *   - id (required): UUID of the task
 * Query Parameters:
 *   - organizationId (required): UUID of the organization (partition key)
 */
async function GetTaskHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const taskId = request.params.id;
  const organizationId = request.query.get("organizationId");

  context.log(`GET /api/tasks/${taskId}`);

  // Validate inputs
  if (!taskId) {
    return { status: 400, jsonBody: { error: "Task ID is required in the route" } };
  }

  const idError = validateUUID(taskId, "id");
  if (idError) {
    return { status: 400, jsonBody: { error: "Validation failed", details: [idError] } };
  }

  if (!organizationId) {
    return { status: 400, jsonBody: { error: "organizationId query parameter is required" } };
  }

  const orgError = validateUUID(organizationId, "organizationId");
  if (orgError) {
    return { status: 400, jsonBody: { error: "Validation failed", details: [orgError] } };
  }

  const task = await getTask(taskId, organizationId);
  return { status: 200, jsonBody: task };
}

app.http("GetTask", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "tasks/{id}",
  handler: withErrorHandler(GetTaskHandler),
});
