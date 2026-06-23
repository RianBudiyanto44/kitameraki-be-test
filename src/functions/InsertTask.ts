import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { withErrorHandler } from "../middleware/errorHandler";
import { validateCreateTask } from "../validators/task.validator";
import { createTask } from "../services/task.service";
import { CreateTaskInput } from "../models/task.model";

/**
 * POST /api/tasks
 * Creates a new task.
 *
 * Request Body (JSON):
 *   - organizationId (required): UUID of the organization
 *   - title (required): Task title (max 100 chars)
 *   - status (required): Task status (todo, in-progress, completed)
 *   - description (optional): Task description (max 1000 chars)
 *   - dueDate (optional): ISO 8601 date-time string
 *   - priority (optional): Priority level (low, medium, high)
 *   - tags (optional): Array of tag strings (each max 50 chars)
 */
async function InsertTaskHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("POST /api/tasks");

  const body = await request.json();

  // Validate input
  const validation = validateCreateTask(body);
  if (!validation.isValid) {
    return { status: 400, jsonBody: { error: "Validation failed", details: validation.errors } };
  }

  const task = await createTask(body as CreateTaskInput);
  return { status: 201, jsonBody: task };
}

app.http("InsertTask", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "tasks",
  handler: withErrorHandler(InsertTaskHandler),
});
