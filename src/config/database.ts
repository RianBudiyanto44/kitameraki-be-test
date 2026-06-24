import { CosmosClient, Container, Database } from "@azure/cosmos";

let client: CosmosClient | null = null;

/**
 * Returns a singleton CosmosClient instance.
 * Reads the connection string from the COSMOS_CONNECTION_STRING environment variable.
 */
function getCosmosClient(): CosmosClient {
  if (!client) {
    const connectionString = process.env.COSMOS_CONNECTION_STRING;
    if (!connectionString) {
      throw new Error(
        "COSMOS_CONNECTION_STRING environment variable is not set. " +
        "Please configure it in local.settings.json or Azure Function App Settings."
      );
    }
    client = new CosmosClient(connectionString);
  }
  return client;
}

/**
 * Returns the database instance.
 */
function getDatabase(): Database {
  const databaseName = process.env.COSMOS_DATABASE_NAME || "TaskApp";
  return getCosmosClient().database(databaseName);
}

/**
 * Returns the Tasks container instance.
 */
export function getTasksContainer(): Container {
  const containerName = process.env.COSMOS_CONTAINER_NAME || "Tasks";
  return getDatabase().container(containerName);
}

/**
 * Returns the Settings container instance.
 */
export function getSettingsContainer(): Container {
  const containerName = process.env.COSMOS_SETTINGS_CONTAINER_NAME || "Settings";
  return getDatabase().container(containerName);
}
