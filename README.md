# Infisical Javascript SDK V2

The Infisical SDK provides a convenient way to interact with the Infisical API. 

## Installation

```bash
npm install @infisical/sdk-v2
```

## Getting Started

```typescript

const client = new InfisicalSDK({
  siteUrl: "your-infisical-instance.com" // Optional, defaults to https://app.infisical.com
});

// Authenticate with Infisical
await client.auth().universalAuth.login({
  clientId: "<machine-identity-client-id>",
  clientSecret: "<machine-identity-client-secret>"
});

const allSecrets = await client.secrets().listSecrets({
  environment: "dev", // stg, dev, prod, or custom environment slugs
  workspaceId: "<your-project-id>"
});

console.log("Fetched secrets", allSecrets)
```

## Core Methods

The SDK methods are organized into the following high-level categories:

1. `auth`: Handles authentication methods.
2. `secrets`: Manages CRUD operations for secrets.

### `auth`

The `Auth` component provides methods for authentication:

#### Universal Auth

```typescript
await client.auth().universalAuth.login({
  clientId: "<machine-identity-client-id>",
  clientSecret: "<machine-identity-client-secret>"
});
```


### `secrets`

This sub-class handles operations related to secrets:

#### List Secrets

```typescript
const allSecrets = await client.secrets().listSecrets({
  environment: "dev",
  projectId: "<your-project-id>",
  expandSecretReferences: true,
  includeImports: false,
  recursive: false,
  secretPath: "/foo/bar"
});
```

**Parameters:**
- `projectId` (string): The ID of your project.
- `environment` (string): The environment in which to list secrets (e.g., "dev").
- `secretPath` (str): The path to the secrets.
- `expandSecretReferences` (bool): Whether to expand secret references.
- `recursive` (bool): Whether to list secrets recursively.
- `includeImports` (bool): Whether to include imported secrets.
- `tagFilters` (string[]): Tags to filter secrets.

**Returns:**
- `ApiV3SecretsRawGet200Response`: The response containing the list of secrets.

#### Create Secret

```typescript
	const newSecret = await client.secrets().createSecret("SECRET_NAME", {
		environment: "dev",
		projectId: "<your-project-id>",
		secretValue: "SECRET_VALUE",
		secretComment: "This is a new secret",          // Optional
		secretPath: "/foo/bar",                         // Optional
		secretReminderNote: "This is a reminder note",  // Optional
		secretReminderRepeatDays: 7,                    // Optional
		skipMultilineEncoding: false,                   // Optional
		tagIds: ["tagId1", "tagId2"],                   // Optional
		type: "personal"                                // Optional
	});
```

**Parameters:**
- `projectId` (string): The ID of your project.
- `environment` (str): The environment in which to create the secret.
- `secretValue` (str): The value of the secret.
- `secretPath` (string, optional): The path to the secret.
- `secretComment` (str, optional): A comment associated with the secret.
- `skipMultilineEncoding` (bool, optional): Whether to skip encoding for multiline secrets.
- `secretReminderNote` (string, optional): A note for the secret reminder.
- `secretReminderRepeatDays` (number, optional): Number of days after which to repeat secret reminders.
- `tagIds` (string[], optional): Array of tags to assign to the new secret.
- `type` (personal | shared, optional): Which type of secret to create.

**Returns:**
- `ApiV3SecretsRawSecretNamePost200Response`: The response after creating the secret.

#### Update Secret

```typescript
const updatedSecret = await client.secrets().updateSecret("SECRET_TO_UPDATE", {
  environment: "dev",                                     
  projectId: "<your-project-id>",                                  
  secretValue: "UPDATED_SECRET_VALUE",                    
  newSecretName: "NEW_SECRET_NAME2",                      // Optional
  secretComment: "This is an updated secret",             // Optional
  secretPath: "/foo/bar",                                 // Optional
  secretReminderNote: "This is an updated reminder note", // Optional
  secretReminderRepeatDays: 14,                           // Optional
  skipMultilineEncoding: false,                           // Optional
  tagIds: ["tagId1", "tagId2"],                           // Optional
  type: "personal",                                       // Optional
  metadata: {                                             // Optional
    extra: "metadata"
  }
});
```

**Parameters:**
- `environment` (str): The environment in which to update the secret.
- `projectId` (str): The ID of your project.
- `secretValue` (str, optional): The new value of the secret.
- `newSecretName` (str, optional): A new name for the secret.
- `secretComment` (str, optional): An updated comment associated with the secret.
- `secretPath` (str): The path to the secret.
- `secretReminderNote` (str, optional): An updated note for the secret reminder.
- `secretReminderRepeatDays` (number, optional): Updated number of days after which to repeat secret reminders.
- `skipMultilineEncoding` (bool, optional): Whether to skip encoding for multiline secrets.
- `tagIds` (string[], optional): Array of tags to assign to the secret.
- `type` (personal | shared, optional): Which type of secret to create.
- `metadata` (object, optional): Assign additional details to the secret, accessible through the API.

**Returns:**
- `ApiV3SecretsRawSecretNamePost200Response`: The response after updating the secret.

#### Get Secret by Name

```typescript
	const singleSecret = await client.secrets().getSecret({
    environment: "dev",
		projectId: "<your-project-id>",
		secretName: "DATABASE_URL",
		expandSecretReferences: true, // Optional
		includeImports: true,         // Optional
		secretPath: "/foo/bar",       // Optional
		type: "shared",               // Optional
		version: 1                    // Optional
	});
```

**Parameters:**
- `environment` (str): The environment in which to retrieve the secret.
- `projectId` (str): The ID of your project.
- `secretName` (str): The name of the secret.
- `secretPath` (str, optional): The path to the secret.
- `expandSecretReferences` (bool, optional): Whether to expand secret references.
- `includeImports` (bool): Whether to include imported secrets.
- `version` (str, optional): The version of the secret to retrieve. Fetches the latest by default.
- `type` (personal | shared, optional): The type of secret to fetch.


**Returns:**
- `ApiV3SecretsRawSecretNameGet200Response`: The response containing the secret.

#### Delete Secret by Name

```typescript
const deletedSecret = await client.secrets().deleteSecret("SECRET_TO_DELETE", {
  environment: "dev",
  projectId: "<your-project-id>",
  secretPath: "/foo/bar", // Optional
  type: "personal"        // Optional
});
```

**Parameters:**
- `projectId` (str): The ID of your project.
- `environment` (str): The environment in which to delete the secret.
- `secret_path` (str, optional): The path to the secret.
- `type` (personal | shared, optional): The type of secret to delete.

**Returns:**
- `ApiV3SecretsRawSecretNamePost200Response`: The response after deleting the secret.