import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { updateFormSettings } from "../services/settings.service";
import { withErrorHandler } from "../middleware/errorHandler";
import { FormSettings } from "../models/settings.model";

export const UpdateFormSettings = withErrorHandler(async (
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> => {
  const organizationId = request.query.get("organizationId");
  if (!organizationId) {
    return { status: 400, body: "Missing organizationId query parameter" };
  }

  const body = (await request.json()) as FormSettings;
  
  // Basic validation
  if (!body || !Array.isArray(body.fields)) {
    return {
      status: 400,
      jsonBody: { error: "Invalid payload. 'fields' must be an array." },
    };
  }

  const updatedSettings = await updateFormSettings(organizationId, body);

  return {
    status: 200,
    jsonBody: updatedSettings,
  };
});

app.http("UpdateFormSettings", {
  methods: ["PUT"],
  authLevel: "anonymous",
  route: "settings/form",
  handler: UpdateFormSettings,
});
