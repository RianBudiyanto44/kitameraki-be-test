import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { withErrorHandler } from "../middleware/errorHandler";
import { validateUUID } from "../validators/task.validator";
import { deleteTask } from "../services/task.service";

/**
 * DELETE /api/tasks/{id}
 * Deletes a single task by its ID.
 *
 * Route Parameters:
 *   - id (required): UUID of the task
 * Query Parameters:
 *   - organizationId (required): UUID of the organization (partition key)
 */
async function DeleteTaskHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const taskId = request.params.id;
  const organizationId = request.query.get("organizationId");

  context.log(`DELETE /api/tasks/${taskId}`);

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

  await deleteTask(taskId, organizationId);
  return { status: 204 };
}

app.http("DeleteTask", {
  methods: ["DELETE"],
  authLevel: "anonymous",
  route: "tasks/{id}",
  handler: withErrorHandler(DeleteTaskHandler),
});
