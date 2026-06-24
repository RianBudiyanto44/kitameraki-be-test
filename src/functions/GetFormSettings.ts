import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getFormSettings } from "../services/settings.service";
import { withErrorHandler } from "../middleware/errorHandler";

export const GetFormSettings = withErrorHandler(async (
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> => {
  const organizationId = request.query.get("organizationId");
  if (!organizationId) {
    return { status: 400, body: "Missing organizationId query parameter" };
  }

  const settings = await getFormSettings(organizationId);
  return {
    status: 200,
    jsonBody: settings,
  };
});

app.http("GetFormSettings", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "settings/form",
  handler: GetFormSettings,
});
