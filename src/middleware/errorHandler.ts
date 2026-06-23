import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

/**
 * Azure Function handler type.
 */
type AzureFunctionHandler = (
  request: HttpRequest,
  context: InvocationContext
) => Promise<HttpResponseInit>;

/**
 * Higher-order function that wraps an Azure Function handler with
 * centralized error handling and logging.
 */
export function withErrorHandler(handler: AzureFunctionHandler): AzureFunctionHandler {
  return async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      return await handler(request, context);
    } catch (error: unknown) {
      context.error("Unhandled error in function handler:", error);

      // Handle Cosmos DB specific errors
      if (isCosmosError(error)) {
        const cosmosError = error as CosmosError;

        if (cosmosError.code === 404) {
          return {
            status: 404,
            jsonBody: { error: "Resource not found" },
          };
        }

        if (cosmosError.code === 409) {
          return {
            status: 409,
            jsonBody: { error: "Resource conflict — item already exists" },
          };
        }

        if (cosmosError.code === 429) {
          return {
            status: 429,
            jsonBody: { error: "Too many requests — please retry later" },
          };
        }
      }

      // Handle JSON parse errors
      if (error instanceof SyntaxError) {
        return {
          status: 400,
          jsonBody: { error: "Invalid JSON in request body" },
        };
      }

      // Generic server error
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred";
      return {
        status: 500,
        jsonBody: { error: message },
      };
    }
  };
}

/**
 * Cosmos DB error shape.
 */
interface CosmosError {
  code: number;
  body?: {
    message?: string;
  };
}

/**
 * Type guard for Cosmos DB errors.
 */
function isCosmosError(error: unknown): error is CosmosError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as CosmosError).code === "number"
  );
}
