# Kitameraki Backend — Task Management API

Azure Functions (Node.js v4 programming model) + Azure Cosmos DB backend for the Task Management App.

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [Azure Functions Core Tools](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local) v4
- An Azure Cosmos DB account (or [Cosmos DB Emulator](https://learn.microsoft.com/en-us/azure/cosmos-db/local-emulator) for local development)

## Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Configure environment variables:**

   Create a `local.settings.json` file in the project root (this file is gitignored):

   ```json
   {
     "IsEncrypted": false,
     "Values": {
       "AzureWebJobsStorage": "",
       "FUNCTIONS_WORKER_RUNTIME": "node",
       "COSMOS_CONNECTION_STRING": "<your-cosmos-db-connection-string>",
       "COSMOS_DATABASE_NAME": "TaskApp",
       "COSMOS_CONTAINER_NAME": "Tasks"
     },
     "Host": {
       "CORS": "http://localhost:5173",
       "CORSCredentials": false
     }
   }
   ```

3. **Set up Cosmos DB:**

   - Create a database named `TaskApp`
   - Create a container named `Tasks` with partition key `/organizationId`

## Running Locally

```bash
npm start
```

This will clean, build, and start the Azure Functions host. The API will be available at `http://localhost:7071/api/`.

For watch mode during development:

```bash
npm run watch
# In another terminal:
func start
```

## API Endpoints

| Method   | Route                | Description                    |
| -------- | -------------------- | ------------------------------ |
| `GET`    | `/api/tasks`         | List tasks (paginated)         |
| `GET`    | `/api/tasks/{id}`    | Get a single task              |
| `POST`   | `/api/tasks`         | Create a new task              |
| `PATCH`  | `/api/tasks/{id}`    | Update an existing task        |
| `DELETE` | `/api/tasks/{id}`    | Delete a single task           |
| `DELETE` | `/api/tasks/bulk`    | Bulk delete tasks              |

### Query Parameters for `GET /api/tasks`

| Parameter        | Required | Default | Description                                 |
| ---------------- | -------- | ------- | ------------------------------------------- |
| `organizationId` | Yes      | —       | UUID of the organization                    |
| `page`           | No       | `1`     | Page number                                 |
| `pageSize`       | No       | `10`    | Items per page (max 100)                    |
| `search`         | No       | —       | Search term (matches title & description)   |
| `status`         | No       | —       | Filter: `todo`, `in-progress`, `completed`  |
| `priority`       | No       | —       | Filter: `low`, `medium`, `high`             |
| `sortBy`         | No       | `title` | Sort field: `title`, `status`, `priority`, `dueDate` |
| `sortOrder`      | No       | `asc`   | Sort direction: `asc` or `desc`             |

### Task Schema

```json
{
  "id": "uuid",
  "organizationId": "uuid",
  "title": "string (max 100)",
  "description": "string (max 1000, optional)",
  "dueDate": "ISO 8601 date-time (optional)",
  "priority": "low | medium | high (optional)",
  "status": "todo | in-progress | completed",
  "tags": ["string (max 50 each)", "..."] 
}
```

## Project Structure

```
src/
├── config/
│   └── database.ts          # Singleton CosmosClient configuration
├── models/
│   └── task.model.ts         # TypeScript interfaces and enums
├── validators/
│   └── task.validator.ts     # Input validation functions
├── middleware/
│   └── errorHandler.ts       # Centralized error handling
├── services/
│   └── task.service.ts       # Business logic (CRUD operations)
├── functions/
│   ├── GetTasks.ts           # GET    /api/tasks
│   ├── GetTask.ts            # GET    /api/tasks/{id}
│   ├── InsertTask.ts         # POST   /api/tasks
│   ├── UpdateTask.ts         # PATCH  /api/tasks/{id}
│   ├── DeleteTask.ts         # DELETE /api/tasks/{id}
│   └── BulkDeleteTasks.ts    # DELETE /api/tasks/bulk
└── index.ts                  # Azure Functions app setup
```
