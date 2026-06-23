import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { withErrorHandler } from "../middleware/errorHandler";
import { validateUUID, validateUpdateTask } from "../validators/task.validator";
import { updateTask } from "../services/task.service";
import { UpdateTaskInput } from "../models/task.model";

/**
 * PATCH /api/tasks/{id}
 * Updates an existing task. Only the provided fields are modified.
 *
 * Route Parameters:
 *   - id (required): UUID of the task
 * Query Parameters:
 *   - organizationId (required): UUID of the organization (partition key)
 * Request Body (JSON):
 *   - title (optional): Updated title
 *   - description (optional): Updated description
 *   - dueDate (optional): Updated due date
 *   - priority (optional): Updated priority
 *   - status (optional): Updated status
 *   - tags (optional): Updated tags
 */
async function UpdateTaskHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const taskId = request.params.id;
  const organizationId = request.query.get("organizationId");

  context.log(`PATCH /api/tasks/${taskId}`);

  // Validate route parameter
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

  // Validate body
  const body = await request.json();
  const validation = validateUpdateTask(body);
  if (!validation.isValid) {
    return { status: 400, jsonBody: { error: "Validation failed", details: validation.errors } };
  }

  const updatedTask = await updateTask(taskId, organizationId, body as UpdateTaskInput);
  return { status: 200, jsonBody: updatedTask };
}

app.http("UpdateTask", {
  methods: ["PATCH"],
  authLevel: "anonymous",
  route: "tasks/{id}",
  handler: withErrorHandler(UpdateTaskHandler),
});
