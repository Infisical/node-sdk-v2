# Infisical Node.js SDK

The Infisical SDK provides a convenient way to interact with the Infisical API. 

## Deprecation Notice

Please be aware that all versions prior to `3.0.0` are officially fully unsupported.
Please upgrade to version 3.0.0 or newer in order to recieve the latest updates. 

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
  projectId: "<your-project-id>"
});

console.log("Fetched secrets", allSecrets)
```

## Core Methods

The SDK methods are organized into the following high-level categories:

1. `auth`: Handles authentication methods.
2. `secrets`: Manages CRUD operations for secrets.
3. `dynamicSecrets`: Manages dynamic secrets and leases.
4. `projects`: Creates and manages projects.
5. `environments`: Creates and manages environments.
6. `folders`: Creates and manages folders.

### `auth`

The `Auth` component provides methods for authentication:

#### Universal Auth

#### Authenticating
```typescript
await client.auth().universalAuth.login({
  clientId: "<machine-identity-client-id>",
  clientSecret: "<machine-identity-client-secret>"
});
```

**Parameters:**
- `options` (object):
  - `clientId` (string): The client ID of your Machine Identity.
  - `clientSecret` (string): The client secret of your Machine Identity.

#### Renewing
You can renew the authentication token that is currently set by using the `renew()` method.
```typescript
await client.auth().universalAuth.renew();
```

#### Manually set access token
By default, when you run a successful `.login()` method call, the access token returned will be auto set for the client instance. However, if you wish to set the access token manually, you may use this method.

```typescript
client.auth().accessToken("<your-access-token>")
```

**Parameters:**
- `accessToken` (string): The access token to be used for authentication. _This should not include "Bearer"._


#### AWS IAM

> [!NOTE]   
> AWS IAM auth only works when the SDK is being used from within an AWS service, such as Lambda, EC2, etc.

#### Authenticating
```typescript
await client.auth().awsIamAuth.login({
  identityId: "<your-identity-id>"
})
```

**Parameters:**
- `options` (object):
  - `identityId` (string): The ID of your identity

#### Renewing
You can renew the authentication token that is currently set by using the `renew()` method.
```typescript
await client.auth().awsIamAuth.renew();
```


### `secrets`

This sub-class handles operations related to secrets:

#### List Secrets

```typescript
const allSecrets = await client.secrets().listSecrets({
  environment: "dev",
  projectId: "<your-project-id>",
  expandSecretReferences: true,
  viewSecretValue: true,
  includeImports: false,
  recursive: false,
  secretPath: "/foo/bar",
});
```

**Parameters:**
- `projectId` (string): The ID of your project.
- `environment` (string): The environment in which to list secrets (e.g., "dev").
- `secretPath` (str): The path to the secrets.
- `expandSecretReferences` (bool, optional): Whether to expand secret references.
- `viewSecretValue` (bool, optional): Whether or not to reveal the secret value of the secrets. If set to `false`, the `secretValue` is masked with `<hidden-by-infisical>`. Defaults to `true`.
- `recursive` (bool, optional): Whether to list secrets recursively.
- `includeImports` (bool, optional): Whether to include imported secrets.
- `tagFilters` (string[], optional): Tags to filter secrets.

**Returns:**
- `ListSecretsResponse`: The response containing the list of secrets.

#### List secrets with imports

The `listSecretsWithImports` method makes it easier to get all your secrets at once. The imported secrets will automatically be added to the secrets returned. The secrets in the selected environment will take precedence over the imported secrets. This means if you have secrets with conflicting names, the secret from the environment the import was imported into, will take precedence. 

```typescript
const allSecrets = await client.secrets().listSecretsWithImports({
  environment: "dev",
  projectId: "<your-project-id>",
  expandSecretReferences: true,
  viewSecretValue: true,
  recursive: false,
  secretPath: "/foo/bar"
});
```

**Parameters:**
- `projectId` (string): The ID of your project.
- `environment` (string): The environment in which to list secrets (e.g., "dev").
- `secretPath` (str): The path to the secrets.
- `expandSecretReferences` (bool, optional): Whether to expand secret references.
- `viewSecretValue` (bool, optional): Whether or not to reveal the secret value of the secrets. If set to `false`, the `secretValue` is masked with `<hidden-by-infisical>`. Defaults to `true`.
- `recursive` (bool, optional): Whether to list secrets recursively.
- `tagFilters` (string[], optional): Tags to filter secrets.

**Returns:**
- `Secret[]`: Returns the list of secrets objects, with imports.



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
- `CreateSecretResponse`: The response after creating the secret.

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
- `UpdateSecretResponse`: The response after updating the secret.

#### Get Secret by Name

```typescript
	const singleSecret = await client.secrets().getSecret({
    environment: "dev",
		projectId: "<your-project-id>",
		secretName: "DATABASE_URL",
		expandSecretReferences: true, // Optional
    viewSecretValue: true,        // Optional
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
- `viewSecretValue` (bool, optional): Whether or not to reveal the secret value of the secret. If set to `false`, the `secretValue` is masked with `<hidden-by-infisical>`. Defaults to `true`.
- `includeImports` (bool): Whether to include imported secrets.
- `version` (str, optional): The version of the secret to retrieve. Fetches the latest by default.
- `type` (personal | shared, optional): The type of secret to fetch.


**Returns:**
- `Secret`: Returns the secret object.

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
- `DeleteSecretResponse`: The response after deleting the secret.




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
- `DynamicSecret`: The created dynamic secret.


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
- `DynamicSecret`: The deleted dynamic secret.

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
- `CreateLeaseResponse`: The dynamic secret lease result.


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
- `DeleteLeaseResponse`: The deleted lease result.

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
- `RenewLeaseResponse`: The renewed lease response _(doesn't contain new credentials)_.

### `projects`

#### Create a new project

```typescript
const project = await client.projects().create({
  projectName: "<name-of-project>",
  type: "secret-manager", // cert-manager, secret-manager, kms, ssh
  projectDescription: "<project-description>", // Optional
  slug: "<slug-of-project-to-create>", // Optional
  template: "<project-template-name>", // Optional
  kmsKeyId: "kms-key-id" // Optional
});
```

**Parameters:**
- `projectName` (string): The name of the project to create.
- `type` (string): The type of project to create. Valid options are `secret-manager`, `cert-manager`, `kms`, `ssh`
- `projectDescription` (string): An optional description of the project to create.
- `slug` (string): An optional slug for the project to create. If not provided, one will be generated automatically.
- `template` (string): Optionally provide a project template name to use for creating this project.
- `kmsKeyId` (string): The ID of the KMS key to use for the project. Will use the Infisical KMS by default.

**Returns:**
- `Project`: The project that was created.


#### Invite members to a project

When inviting members to projects, you must either specify the `emails` or `usernames`. If neither are specified, the SDK will throw an error.

```typescript
const memberships = await client.projects().inviteMembers({
  projectId: project.id,
  emails: ["test1@example.com", "test2@example.com"], // Optional
  usernames: ["example-user3", "example-user4"] // Optional 
  roleSlugs: ["member"] // Optional
});
```

**Parameters:**
- `projectId`: (string): The ID of the project to invite members to
- `emails`: (string[]): An array of emails of the users to invite to the project.
- `usernames`: (string[]) An array of usernames of the users to invite to the project.
- `roleSlugs`: (string[]): An array of role slugs to assign to the members. If not specified, this will default to `member`.

**Returns:**
- `Membership[]`: An array of the created project memberships.

### `environments`

#### Create a new environment

```typescript
const environment = await client.environments().create({
  name: "<environment-name>",
  projectId: "<your-project-id>",
  slug: "<environment-slug>",
  position: 1 // Optional
});
```

**Parameters:**
- `name` (string): The name of the environment to be created.
- `projectId` (string): The ID of the project to create the environment within.
- `slug`: (string): The slug of the environment to be created.
- `position` (number): An optional position of the environment to be created. The position is used in the Infisical UI to display environments in order. Environments with the lowest position come first.

**Returns:**
- `Environment`: The environment that was created.

#### Create a new folder

```typescript
const folder = await client.folders().create({
  name: "<folder-name>",
  path: "<folder-path>",
  projectId: "<your-project-id>",
  environment: "<environment-slug>",
  description: "<folder-description>" // Optional
});
```

**Parameters:**
- `name` (string): The name of the folder to create.
- `path` (string): The path where of where to create the folder. Defaults to `/`, which is the root folder.
- `projectId` (string): The ID of the project to create the folder within.
- `environment` (string): The slug of the environment to create the folder within.
- `description` (string): An optional folder description.

**Returns:**
- `Folder`: The folder that was created.

#### List folders

```typescript
const folders = await client.folders().listFolders({
  environment: "dev",
  projectId: "<your-project-id>",
  path: "/foo/bar", // Optional
  recursive: false // Optional
});
```

**Parameters:**
- `environment` (string): The slug of the environment to list folders within.
- `projectId` (string): The ID of the project to list folders within.
- `path` (string): The path to list folders within. Defaults to `/`, which is the root folder.
- `recursive` (boolean): An optional flag to list folders recursively. Defaults to `false`.

**Returns:**
- `Folder[]`: An array of folders.
