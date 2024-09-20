# Infisical Javascript SDK V2

The Infisical SDK provides a convenient way to interact with the Infisical API. 

## Installation

```bash
npm install @infisical/sdk
```

## Getting Started

```typescript
import { InfisicalSDK } from '@infisical/sdk'

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
- `secretName` (string): The name of the secret to create
- `options` (object):
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
- `secretName` (string): The name of the secret to update.`
- `options` (object):
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
- `secretName` (string): The name of the secret to delete.
- `options` (object): 
  - `projectId` (str): The ID of your project.
  - `environment` (str): The environment in which to delete the secret.
  - `secret_path` (str, optional): The path to the secret.
  - `type` (personal | shared, optional): The type of secret to delete.

**Returns:**
- `ApiV3SecretsRawSecretNamePost200Response`: The response after deleting the secret.




### `dynamicSecrets`


#### Create a new dynamic secret

Creating a new dynamic secret can be done by using the `.dynamicSecrets().create({})` function. More details below.


The input for creating new dynamic secret varies greatly between secret types.
For a more in-depth description of each input type for each dynamic secret type, please refer to [our API documentation](https://infisical.com/docs/api-reference/endpoints/dynamic-secrets/create)


##### Example for creating a new Redis dynamic secret

```typescript
import { InfisicalSDK, DynamicSecretProviders } from "@infisical/sdk";
	const client = new InfisicalSDK();

	await client.auth().universalAuth.login({
		// For localhost
		clientId: "CLIENT_ID",
		clientSecret: "CLIENT_SECRET"
	});
const dynamicSecret = await client.dynamicSecrets().create({
  provider: {
    type: DynamicSecretProviders.Redis,
    inputs: {
      host: "<redis-host>",
      port: 6479,
      username: "<redis-username>",
      password: "<redis-password>", // Only required if your Redis instance uses authentication (recommended)
      creationStatement: "ACL SETUSER {{username}} on >{{password}} ~* &* +@all",
      revocationStatement: "ACL DELUSER {{username}}"
    }
  },
  defaultTTL: "1h",
  maxTTL: "24h",
  name: "dynamic-secret-name",
  projectSlug: "project-slug",
  environmentSlug: "dev"
});
console.log(dynamicSecret);
```

**Returns:**
- `ApiV1DynamicSecretsPost200Response['dynamicSecret']`: The response after creating the dynamic secret


#### Delete a dynamic secret

Note: Deleting a dynamic secret will also delete it's associated leases.

```typescript
const deletedDynamicSecret = await client.dynamicSecrets().delete("dynamic-secret-name", {
  environmentSlug: "dev",
  projectSlug: "project-slug"
});
```

**Parameters:**
- `secretName` (string): The ID of the dynamic secret to delete
- `options` (object):
  - `projectSlug` (str): The ID of your project.
  - `environment` (str): The environment in which to delete the secret.

**Returns:**
- `ApiV1DynamicSecretsDelete200Response['dynamicSecret']`: The response after deleting the dynamic secret

### `dynamicSecrets.leases`
In this section you'll learn how to work with dynamic secret leases


#### Create a new lease

```typescript
const lease = await client.dynamicSecrets().leases.create({
  dynamicSecretName: "dynamic-secret-name",
  environmentSlug: "dev",
  projectSlug: "your-project-slug",
  path: "/foo/bar",
  ttl: "5m" // Optional
});

console.log(lease);
```

**Your dynamic secret credentials will be contained user `lease.data` in this example.**

**Parameters:**
- `dynamicSecretName` (string): The name of the dynamic secret you wish to create a lease for.
- `projectSlug` (string): The slug of the project where the secret is located.
- `environmentSlug` (string): The environment where the dynamic secret is located.
- `path` (string, optional): The path of where the dynamic secret is located. 
- `ttl` (string, optional): A [vercel/ms](https://github.com/vercel/ms) encoded string representation of how long the lease credentials should be valid for. This will default to the dynamic secret's default TTL if not specified.

**Returns:**
- `ApiV1DynamicSecretsLeasesPost200Response`: The dynamic secret lease result.


#### Delete a lease
```typescript
const deletedLease = await client.dynamicSecrets().leases.delete(newLease.lease.id, {
  environmentSlug: "dev",
  projectSlug: "test-zb-3a",
  path: "/foo/bar",
  isForced: false // Wether or not to forcefully delete the lease. This can't guarantee that the lease will be deleted from the external provider.
});
```

**Parameters:**
- `leaseId` (string): The ID of the lease you want to delete.
- options:
  - `projectSlug` (string): The slug of the project where the secret is located.
  - `environmentSlug` (string): The environment where the dynamic secret is located.
  - `path` (string, optional): The path of where the dynamic secret is located. 
  - `isForced` (bool, optional): Wether or not to forcefully delete the lease. This can't guarantee that the lease will be deleted from the external provider, and is potentially unsafe for sensitive dynamic secrets.

**Returns:**
- `ApiV1DynamicSecretsLeasesLeaseIdDelete200Response`: The deleted lease result.

#### Renew a lease

Please note that renewals must happen **before** the lease has fully expired. After renewing the lease, you won't be given new credentials. Instead the existing credentials will continue to live for the specified TTL

```typescript
const renewedLease = await client.dynamicSecrets().leases.renew(newLease.lease.id, {
		environmentSlug: "dev",
		projectSlug: "project-slug",
		path: "/foo/bar", // Optional
		ttl: "10m" // Optional
	});
```

**Parameters:**
- `leaseId` (string): The ID of the lease you want to delete.
- `options` (object):
  - `projectSlug` (string): The slug of the project where the secret is located.
  - `environmentSlug` (string): The environment where the dynamic secret is located.
  - `path` (string, optional): The path of where the dynamic secret is located. 
  - `ttl` (string, optional): A [vercel/ms](https://github.com/vercel/ms) encoded string representation of how long the lease credentials should be valid for. This will default to the dynamic secret's default TTL if not specified.

**Returns:**
- `ApiV1DynamicSecretsLeasesLeaseIdDelete200Response`: The renewed lease response _(doesn't contain new credentials)_.

