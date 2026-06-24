export type CustomFieldType = "text" | "date" | "datetime" | "email";

export interface CustomField {
  id: string; // Unique identifier for the field
  type: CustomFieldType;
  label: string; // User-defined label
  width?: number; // e.g., 12 for full width, 6 for half, 4 for 1/3, 3 for 1/4
}

export interface FormSettings {
  id: string; // Fixed as "form-settings" to ensure only one document exists per organization
  organizationId: string;
  fields: CustomField[];
}
