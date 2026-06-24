import { CosmosClient, Container } from "@azure/cosmos";
import { FormSettings } from "../models/settings.model";

let settingsContainer: Container | null = null;

/**
 * Ensures the Settings container exists, creating it if necessary.
 * Returns a cached Container reference.
 */
async function ensureSettingsContainer(): Promise<Container> {
  if (settingsContainer) return settingsContainer;

  const connectionString = process.env.COSMOS_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error("COSMOS_CONNECTION_STRING environment variable is not set.");
  }

  const client = new CosmosClient(connectionString);
  const databaseName = process.env.COSMOS_DATABASE_NAME || "TaskApp";
  const database = client.database(databaseName);

  const { container } = await database.containers.createIfNotExists({
    id: "Settings",
    partitionKey: { paths: ["/organizationId"] },
  });

  settingsContainer = container;
  return container;
}

/**
 * Retrieves the form settings for a given organization.
 * If no settings exist, returns a default empty configuration.
 */
export async function getFormSettings(organizationId: string): Promise<FormSettings> {
  const container = await ensureSettingsContainer();
  try {
    const { resource } = await container.item("form-settings", organizationId).read<FormSettings>();
    if (resource) {
      return resource;
    }
  } catch (error: any) {
    // If not found, fall through and return default
    if (error.code !== 404) {
      throw error;
    }
  }

  // Return default configuration
  return {
    id: "form-settings",
    organizationId,
    fields: [],
  };
}

/**
 * Updates or creates the form settings for a given organization.
 */
export async function updateFormSettings(
  organizationId: string,
  settings: FormSettings
): Promise<FormSettings> {
  const container = await ensureSettingsContainer();
  // Ensure the id and organizationId are correct
  const documentToSave: FormSettings = {
    ...settings,
    id: "form-settings",
    organizationId,
  };

  const { resource } = await container.items.upsert<FormSettings>(documentToSave);
  return resource!;
}
