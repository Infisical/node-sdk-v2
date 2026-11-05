// Infisical Agent Vault: proxies, sessions, access bundles and delegations.
// Timestamps are ISO 8601 strings, as the API sends them.

/** Which hosts an agent may reach through an Agent Vault proxy. */
export enum AgentVaultTrafficPolicy {
	/** Agents can reach any host. */
	AnyHost = "any-host",
	/** Agents can reach only the hosts that the session's services cover, plus the proxy's allowed hosts. */
	ServiceHosts = "service-hosts"
}

/** The status of an Agent Vault session. */
export enum AgentVaultSessionStatus {
	Active = "active",
	Revoked = "revoked",
	Expired = "expired"
}

/** Whose Agent Vault sessions to list. */
export enum AgentVaultSessionScope {
	Mine = "mine",
	All = "all"
}

/** The kinds of Agent Vault member: users, machine identities and groups. */
export enum AgentVaultMemberType {
	User = "user",
	MachineIdentity = "machineIdentity",
	Group = "group"
}

/** Which users a machine identity can create Agent Vault sessions on behalf of. */
export enum AgentVaultDelegationScope {
	AllMembers = "all-members",
	Selected = "selected"
}

export type AgentVaultOrderDirection = "asc" | "desc";

// Proxies

/** An Agent Vault proxy. Only admins see its settings: trafficPolicy, allowedHosts, pollInterval and createdAt. */
export interface AgentVaultProxy {
	id: string;
	name: string;
	/** What the proxy is for, or null if it has no description. */
	description: string | null;
	/** When the proxy last checked in, or null if it never has. */
	heartbeat: string | null;
	/** Whether the proxy has checked in recently enough to be considered up. */
	isHealthy: boolean;
	/** The SHA-256 fingerprint of the proxy's certificate authority. */
	rootCaFingerprint: string | null;
	/** When the proxy's certificate authority expires. */
	rootCaExpiresAt: string | null;
	trafficPolicy?: AgentVaultTrafficPolicy;
	/** Hosts that stay reachable under the "service-hosts" traffic policy, as one comma-separated string. */
	allowedHosts?: string | null;
	/** How often, in seconds, the proxy refreshes its sessions and settings. */
	pollInterval?: number;
	createdAt?: string;
}

/** An Agent Vault proxy with its settings, as admins see it. */
export interface AgentVaultProxyWithSettings extends AgentVaultProxy {
	trafficPolicy: AgentVaultTrafficPolicy;
	allowedHosts: string | null;
	pollInterval: number;
	createdAt: string;
}

export interface AgentVaultProxyWithTokenResponse {
	proxy: AgentVaultProxyWithSettings;
	/** The proxy token. It's only returned once. */
	proxyToken: string;
}

export interface ListAgentVaultProxiesResponse {
	proxies: AgentVaultProxy[];
	totalCount: number;
}

export interface SingleAgentVaultProxyResponse {
	proxy: AgentVaultProxyWithSettings;
}

export interface DeleteAgentVaultProxyResponse {
	proxy: Pick<AgentVaultProxy, "id" | "name">;
}

// Sessions

/** The user an Agent Vault session belongs to, or the user it was started on behalf of. */
export interface AgentVaultSessionUser {
	type: AgentVaultMemberType.User;
	/** The ID of the user, or null once the user is deleted. */
	id: string | null;
	/** The username of the user. Once the user is deleted, the email address recorded when the session was created. */
	username: string;
	email: string | null;
	firstName: string | null;
	/** The last name of the user, or null once the user is deleted. */
	lastName: string | null;
}

/** The machine identity an Agent Vault session belongs to. */
export interface AgentVaultSessionMachineIdentity {
	type: AgentVaultMemberType.MachineIdentity;
	/** The ID of the machine identity, or null once it's deleted. */
	id: string | null;
	/** The name of the machine identity. Once it's deleted, the name recorded when the session was created. */
	name: string;
}

/** The user or machine identity an Agent Vault session belongs to. */
export type AgentVaultSessionActor = AgentVaultSessionUser | AgentVaultSessionMachineIdentity;

/** The access bundle an Agent Vault session carries. */
export interface AgentVaultSessionAccessBundle {
	/** The ID of the access bundle, or null once it's deleted. */
	id: string | null;
	name: string;
}

// Inline services: services sent with a session, instead of added to an access bundle. Their values are sent exactly
// as given, since inline services can't use variables, so no value can contain text in double braces.

/** An HTTP method that a service can allow. */
export type AgentVaultHttpMethod = "GET" | "HEAD" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS";

/** A part of a request where the proxy replaces a substitution's placeholder with its value. */
export type AgentVaultSubstitutionSurface = "path" | "query" | "header" | "body";

/** How an agent talks to an MCP server: "streamable-http", or "sse" for the legacy HTTP+SSE transport. */
export type AgentVaultMcpTransport = "streamable-http" | "sse";

/** A token that the proxy writes to a header of each request. */
export interface AgentVaultInlineBearerCredential {
	type: "bearer";
	/** The token. */
	value: string;
	/** The header the token is written to. Defaults to "Authorization". */
	headerName?: string;
	/** Written before the token, separated by one space. Defaults to "Bearer" for the Authorization header, and to nothing for any other header. */
	headerPrefix?: string;
}

/** A username and password that the proxy sends as HTTP basic authentication. Set a username, a password, or both. */
export interface AgentVaultInlineBasicCredential {
	type: "basic";
	username?: string;
	password?: string;
}

/** No credential: the proxy lets requests to the service's hosts through without attaching one. */
export interface AgentVaultInlinePassthroughCredential {
	type: "passthrough";
}

/** A header that the proxy attaches to each request, besides the credential. */
export interface AgentVaultInlineCustomHeader {
	name: string;
	/** Written before the value, separated by one space. */
	prefix?: string;
	value: string;
}

/** A placeholder that the proxy replaces with a real value before forwarding a request. */
export interface AgentVaultInlineSubstitution {
	placeholder: string;
	/** The parts of each request where the proxy replaces the placeholder. */
	surfaces: AgentVaultSubstitutionSurface[];
	value: string;
}

/** An HTTP API sent with a session. */
export interface AgentVaultInlineHttpServiceInput {
	type: "http";
	/** A name for the service, in lowercase letters, numbers and hyphens. Without one, the service goes by its first host. */
	name?: string;
	/** The hosts the service covers, separated by commas, such as "api.github.com". A leading "*." matches exactly one label. */
	hostPattern: string;
	/** The HTTP methods the service allows. Defaults to every method. */
	allowedMethods?: AgentVaultHttpMethod[];
	/** The path prefixes the service allows, matched on whole segments. Defaults to every path. */
	allowedPathPrefixes?: string[];
	credential: AgentVaultInlineBearerCredential | AgentVaultInlineBasicCredential | AgentVaultInlinePassthroughCredential;
	/** Up to 20. */
	customHeaders?: AgentVaultInlineCustomHeader[];
	/** Up to 20. */
	substitutions?: AgentVaultInlineSubstitution[];
}

/** An MCP server sent with a session. */
export interface AgentVaultInlineMcpServiceInput {
	type: "mcp";
	/** A name for the service, in lowercase letters, numbers and hyphens. Without one, the service goes by its host. */
	name?: string;
	/** The MCP server's URL, such as "https://mcp.example.com/mcp". The service covers its host. */
	serverUrl: string;
	transport: AgentVaultMcpTransport;
	credential: AgentVaultInlineBearerCredential;
	/** Up to 20. */
	customHeaders?: AgentVaultInlineCustomHeader[];
}

/** A service sent with a session: an HTTP API or an MCP server. */
export type AgentVaultInlineServiceInput = AgentVaultInlineHttpServiceInput | AgentVaultInlineMcpServiceInput;

/** A service sent with a session, as Infisical returns it: without its token, password or values. */
export interface AgentVaultInlineService {
	id: string;
	/** The name the service was sent with, or its first host if it was sent without one. */
	name: string;
	type: "http" | "mcp";
	serverUrl: string | null;
	transport: AgentVaultMcpTransport | null;
	hostPattern: string;
	/** The HTTP methods the service allows, or null for every method. */
	allowedMethods: AgentVaultHttpMethod[] | null;
	/** The path prefixes the service allows, or null for every path. */
	allowedPathPrefixes: string[] | null;
	credential: { type: "bearer"; headerName: string; headerPrefix: string } | { type: "basic" } | { type: "passthrough" };
	customHeaders: { name: string; prefix: string }[];
	substitutions: { placeholder: string; surfaces: AgentVaultSubstitutionSurface[] }[];
}

export interface AgentVaultSession {
	id: string;
	label: string | null;
	actor: AgentVaultSessionActor;
	/** The user the session was started on behalf of, or null when the session is the actor's own. */
	onBehalfOf: AgentVaultSessionUser | null;
	status: AgentVaultSessionStatus;
	/** When the session expires, or null when it never does. */
	expiresAt: string | null;
	revokedAt: string | null;
	createdAt: string;
	/** The access bundle the session carries, or null if it carries only inline services. */
	accessBundle: AgentVaultSessionAccessBundle | null;
	/** The services sent with the session when it was created, without their secrets. Empty if it carries only an access bundle. */
	services: AgentVaultInlineService[];
}

/** An Agent Vault session as returned at creation. */
export interface CreatedAgentVaultSession {
	id: string;
	label: string | null;
	/** The session token. It's only returned once. */
	token: string;
	/** When the session expires, or null when it never does. */
	expiresAt: string | null;
	createdAt: string;
	/** The access bundle the session carries, or null if it carries only inline services. */
	accessBundle: AgentVaultSessionAccessBundle | null;
	/** The services sent with the session, without their secrets. Empty if it carries only an access bundle. */
	services: AgentVaultInlineService[];
}

export interface ListAgentVaultSessionsResponse {
	sessions: AgentVaultSession[];
	totalCount: number;
}

export interface SingleAgentVaultSessionResponse {
	session: AgentVaultSession;
}

export interface CreateAgentVaultSessionResponse {
	session: CreatedAgentVaultSession;
}

export interface RevokeAgentVaultSessionResponse {
	/** The revoked session. The response leaves out its access bundle and inline services. */
	session: Omit<AgentVaultSession, "accessBundle" | "services">;
}

// Access bundles

/** An Agent Vault service, by ID and name. */
export interface AgentVaultServiceRef {
	id: string;
	name: string;
}

/** An Agent Vault access bundle, by ID and name. */
export interface AgentVaultAccessBundleRef {
	id: string;
	name: string;
}

export interface AgentVaultAccessBundle {
	id: string;
	name: string;
	/** What the access bundle is for, or null if it has no description. */
	description?: string | null;
	createdAt: string;
	updatedAt: string;
}

/** An Agent Vault access bundle as listed, with what it holds. */
export interface AgentVaultAccessBundleSummary extends AgentVaultAccessBundle {
	/** How many services the access bundle holds. */
	serviceCount: number;
	/** How many users, machine identities and groups can reach the access bundle. */
	memberCount: number;
	/** Every host pattern the access bundle's services cover. */
	hostPatterns: string[];
	/** The services that still need your personal values, or, when listed on behalf of a user, that user's. */
	servicesRequiringSetup: AgentVaultServiceRef[];
}

/**
 * A service in an Agent Vault access bundle. The SDK doesn't manage services, so a service's nested
 * settings, such as its credential, are left as the API returns them.
 */
export interface AgentVaultService {
	id: string;
	accessBundleId: string;
	name: string;
	/** The kind of service, such as "http" or "mcp". */
	type: string;
	serverUrl: string | null;
	transport: string | null;
	hostPattern: string;
	allowedMethods: string[] | null;
	allowedPathPrefixes: string[] | null;
	/** The MCP tools that agents can call through the service, by exact name, or null for every tool. */
	allowedTools?: string[] | null;
	credential: Record<string, unknown>;
	customHeaders: Record<string, unknown>[];
	substitutions: Record<string, unknown>[];
	/** Only set for admins. */
	variableReferences?: Record<string, unknown>[];
	/** Your own values for the service, or null when the admin sets the whole credential. */
	personalValues: Record<string, unknown> | null;
	createdAt: string;
	updatedAt: string;
}

/** An Agent Vault access bundle with its services. */
export interface AgentVaultAccessBundleWithServices extends AgentVaultAccessBundle {
	services: AgentVaultService[];
}

export interface ListAgentVaultAccessBundlesResponse {
	accessBundles: AgentVaultAccessBundleSummary[];
	totalCount: number;
}

export interface GetAgentVaultAccessBundleResponse {
	accessBundle: AgentVaultAccessBundleWithServices;
}

export interface SingleAgentVaultAccessBundleResponse {
	accessBundle: AgentVaultAccessBundle;
}

// Grants and members

/** A user, machine identity or group, by type and ID. */
export interface AgentVaultActorRef {
	type: AgentVaultMemberType;
	id: string;
}

export interface AgentVaultUser {
	type: AgentVaultMemberType.User;
	id: string;
	username: string;
	email: string | null;
	firstName: string | null;
	lastName: string | null;
}

export interface AgentVaultMachineIdentity {
	type: AgentVaultMemberType.MachineIdentity;
	id: string;
	name: string;
}

export interface AgentVaultGroup {
	type: AgentVaultMemberType.Group;
	id: string;
	name: string;
}

/** A user, machine identity or group that an Agent Vault access bundle is granted to. */
export type AgentVaultGrantee = (
	| (AgentVaultUser & {
			/** Whether the user still has an unaccepted invitation to the organization. */
			isOrgMembershipPending: boolean;
	  })
	| AgentVaultMachineIdentity
	| AgentVaultGroup
) & {
	/** When the access bundle was granted. */
	grantedAt: string;
};

/** A user, machine identity or group that's a member of Agent Vault, with its Agent Vault role. */
export type AgentVaultMember = (
	| (AgentVaultUser & {
			/** Whether the user still has an unaccepted invitation to the organization. */
			isOrgMembershipPending: boolean;
	  })
	| (AgentVaultMachineIdentity & {
			/** Whether Agent Vault created the machine identity. */
			isManagedByAgentVault: boolean;
			/** The ID of the organization the machine identity belongs to. */
			orgId: string | null;
	  })
	| AgentVaultGroup
) & {
	/** The Agent Vault role, such as "admin" or "member". */
	role: string;
	/** Whether the member can currently reach Agent Vault. */
	isActive: boolean;
	/** When the member was added to Agent Vault. */
	addedAt: string;
};

export interface ListAgentVaultGranteesResponse {
	members: AgentVaultGrantee[];
	totalCount: number;
}

export interface ListAgentVaultMembersResponse {
	members: AgentVaultMember[];
	totalCount: number;
}

export interface GrantAgentVaultAccessBundleResponse {
	/** The new grants. */
	members: (AgentVaultActorRef & { grantedAt: string })[];
	/** The grantees that already had the access bundle, left as they were. */
	skipped: AgentVaultActorRef[];
}

export interface RevokeAgentVaultAccessBundleResponse {
	/** The revoked grants. */
	members: AgentVaultActorRef[];
	/** The grantees that didn't have the access bundle, so nothing was revoked. */
	skipped: AgentVaultActorRef[];
}

// Delegations

export interface AgentVaultDelegationUser {
	id: string;
	username: string;
	email: string | null;
	firstName: string | null;
	lastName: string | null;
	/** When the user was added to the delegation. */
	addedAt: string;
}

/** A group in an Agent Vault delegation. Its members are covered while they stay in the group. */
export interface AgentVaultDelegationGroup {
	id: string;
	name: string;
	/** When the group was added to the delegation. */
	addedAt: string;
}

/** Which users a machine identity can create Agent Vault sessions on behalf of. */
export interface AgentVaultDelegation {
	machineIdentity: { id: string; name: string };
	scope: AgentVaultDelegationScope;
	users: AgentVaultDelegationUser[];
	groups: AgentVaultDelegationGroup[];
	createdAt: string;
	updatedAt: string;
}

/**
 * An Agent Vault delegation with the access bundles its machine identity can't create sessions over. A session on
 * behalf of a user can use only an access bundle that both the user and the machine identity can use. The lists are
 * empty when a machine identity that isn't an admin gets its own delegation.
 */
export interface AgentVaultDelegationDetail extends AgentVaultDelegation {
	users: (AgentVaultDelegationUser & {
		/** The access bundles this user can use and the machine identity can't. */
		missingAccessBundles: AgentVaultAccessBundleRef[];
	})[];
	groups: (AgentVaultDelegationGroup & {
		/** The access bundles this group can use and the machine identity can't. */
		missingAccessBundles: AgentVaultAccessBundleRef[];
	})[];
	/** The access bundles that users the delegation covers can use and the machine identity can't. */
	missingAccessBundles: AgentVaultAccessBundleRef[];
}

export interface ListAgentVaultDelegationsResponse {
	delegations: AgentVaultDelegation[];
	totalCount: number;
}

export interface SingleAgentVaultDelegationResponse {
	delegation: AgentVaultDelegationDetail;
}

export interface DeleteAgentVaultDelegationResponse {
	delegation: AgentVaultDelegation;
}

export interface RemoveAgentVaultDelegationSubjectsResponse {
	/** The delegation after the change, or null if it no longer names anyone. */
	delegation: AgentVaultDelegationDetail | null;
}

// Requests, as sent to the API

/** The query string of a delegation route, which names the project because a machine identity can be in several. */
export interface AgentVaultProjectQuery {
	projectId: string;
}

export interface ListAgentVaultProxiesRequest {
	projectId: string;
	search?: string;
	orderBy: "name" | "createdAt";
	orderDirection: AgentVaultOrderDirection;
	limit: number;
	offset: number;
}

export interface CreateAgentVaultProxyRequest {
	projectId: string;
	name: string;
	/** "bundle-hosts" is the old name of "service-hosts", and the only one an Infisical version from before the rename accepts. */
	trafficPolicy: AgentVaultTrafficPolicy | `${AgentVaultTrafficPolicy}` | "bundle-hosts";
	allowedHosts?: string;
	pollInterval: number;
	description?: string;
}

export interface UpdateAgentVaultProxyRequest {
	name?: string;
	/** "bundle-hosts" is the old name of "service-hosts", and the only one an Infisical version from before the rename accepts. */
	trafficPolicy?: AgentVaultTrafficPolicy | `${AgentVaultTrafficPolicy}` | "bundle-hosts";
	/** null removes every allowed host. */
	allowedHosts?: string | null;
	pollInterval?: number;
	description?: string;
}

export interface ListAgentVaultSessionsRequest {
	projectId: string;
	scope: AgentVaultSessionScope | `${AgentVaultSessionScope}`;
	/** Statuses, separated by commas. */
	status?: string;
	search?: string;
	limit: number;
	offset: number;
}

export interface CreateAgentVaultSessionRequest {
	projectId: string;
	accessBundle?: string;
	services?: AgentVaultInlineServiceInput[];
	ttl?: string;
	label?: string;
	onBehalfOf?: { userEmail: string } | { userId: string };
}

export interface UpdateAgentVaultSessionRequest {
	label: string | null;
}

export interface ListAgentVaultAccessBundlesRequest {
	projectId: string;
	search?: string;
	requiresSetup?: boolean;
	granted?: boolean;
	onBehalfOfUserEmail?: string;
	onBehalfOfUserId?: string;
	orderBy: "name" | "serviceCount" | "createdAt";
	orderDirection: AgentVaultOrderDirection;
	limit: number;
	offset: number;
}

export interface CreateAgentVaultAccessBundleRequest {
	projectId: string;
	name: string;
	description?: string;
}

export interface UpdateAgentVaultAccessBundleRequest {
	name?: string;
	description?: string;
}

export interface ListAgentVaultAccessBundleMembersRequest {
	actorType?: AgentVaultMemberType | `${AgentVaultMemberType}`;
	search?: string;
	limit: number;
	offset: number;
}

export interface ChangeAgentVaultAccessBundleGrantsRequest {
	userIds?: string[];
	machineIdentityIds?: string[];
	groupIds?: string[];
}

export interface ListAgentVaultDelegationsRequest {
	projectId: string;
	/** Machine identity IDs, separated by commas. */
	machineIdentityIds?: string;
	limit: number;
	offset: number;
}

export interface SetAgentVaultDelegationRequest {
	scope: AgentVaultDelegationScope | `${AgentVaultDelegationScope}`;
	userIds?: string[];
	groupIds?: string[];
}

export interface ChangeAgentVaultDelegationSubjectsRequest {
	userIds?: string[];
	groupIds?: string[];
}

export interface ListAvailableAgentVaultDelegationSubjectsRequest {
	projectId: string;
	actorType?: AgentVaultMemberType.User | AgentVaultMemberType.Group | "user" | "group";
	search?: string;
	limit: number;
	offset: number;
}

// Options for the SDK's Agent Vault methods

export type AgentVaultProjectOptions = {
	/** The ID of the Agent Vault project. */
	projectId: string;
};

export type ListAgentVaultProxiesOptions = {
	/** The ID of the Agent Vault project to list proxies from. */
	projectId: string;
	/** Match proxies by name or description. */
	search?: string;
	/** What to sort proxies by. Defaults to "createdAt". */
	orderBy?: "name" | "createdAt";
	/** Which way to sort. Defaults to "desc". */
	orderDirection?: AgentVaultOrderDirection;
	/** The maximum number of proxies to return (1-100). Defaults to 20. */
	limit?: number;
	/** How many proxies to skip. Defaults to 0. */
	offset?: number;
};

export type CreateAgentVaultProxyOptions = {
	/** The ID of the Agent Vault project to register the proxy in. */
	projectId: string;
	/** The name of the proxy (a slug, at most 64 characters). */
	name: string;
	/** Which hosts an agent may reach through this proxy: "any-host", or "service-hosts" for only the hosts that the session's services cover. Defaults to "any-host". */
	trafficPolicy?: AgentVaultTrafficPolicy | `${AgentVaultTrafficPolicy}`;
	/** Hosts that stay reachable under the "service-hosts" traffic policy even though none of the session's services cover them. A list or a comma-separated string. */
	allowedHosts?: string | string[];
	/** How often, in seconds, the proxy refreshes its sessions and settings (10-300). Defaults to 60. */
	pollInterval?: number;
	/** What the proxy is for, up to 256 characters, without line breaks or other control characters. */
	description?: string;
};

export type UpdateAgentVaultProxyOptions = {
	/** The new name of the proxy (a slug, at most 64 characters). */
	name?: string;
	/** Which hosts an agent may reach through this proxy: "any-host", or "service-hosts" for only the hosts that the session's services cover. */
	trafficPolicy?: AgentVaultTrafficPolicy | `${AgentVaultTrafficPolicy}`;
	/** Hosts that stay reachable under the "service-hosts" traffic policy. A list or a comma-separated string. Pass an empty list or string to remove every allowed host. */
	allowedHosts?: string | string[];
	/** How often, in seconds, the proxy refreshes its sessions and settings (10-300). */
	pollInterval?: number;
	/** The new description, up to 256 characters, without line breaks or other control characters. Pass an empty string to remove the description. */
	description?: string;
};

export type ListAgentVaultSessionsOptions = {
	/** The ID of the Agent Vault project to list sessions from. */
	projectId: string;
	/** Whose sessions to list: your own ("mine") or everyone's ("all", admins only). Defaults to "mine". */
	scope?: AgentVaultSessionScope | `${AgentVaultSessionScope}`;
	/** Only return sessions with any of these statuses. */
	statuses?: (AgentVaultSessionStatus | `${AgentVaultSessionStatus}`)[];
	/** Match sessions by label, actor name, actor email, the name or email of the user a session was started on behalf of, or access bundle name. */
	search?: string;
	/** The maximum number of sessions to return (1-100). Defaults to 20. */
	limit?: number;
	/** How many sessions to skip. Defaults to 0. */
	offset?: number;
};

export type CreateAgentVaultSessionOptions = {
	/** The ID of the Agent Vault project to create the session in. */
	projectId: string;
	/** The name of the access bundle the session carries. Pass accessBundle, services, or both. */
	accessBundle?: string;
	/**
	 * Services the session carries itself, instead of or beside its access bundle's: up to 20. Only Agent Vault admins
	 * can send them. Each has the same fields as a service in an access bundle, except that its name is optional, its
	 * values can't use variables, it can't use OAuth or member-provided values, and an MCP server can't be limited to
	 * some of its tools. To limit an MCP server's tools, add it to an access bundle instead.
	 */
	services?: AgentVaultInlineServiceInput[];
	/** How long the session lasts: a duration such as "30m", "8h" or "7d" (at least 1m), or "never". Defaults to "7d", or to "1h" for a session on behalf of a user. */
	ttl?: string;
	/** A short description of what the session is for, such as "nightly deploy". Up to 128 characters, without line breaks, tabs, or invisible characters. */
	label?: string;
	/** The email address of the user to start the session on behalf of. Can't be combined with onBehalfOfUserId. */
	onBehalfOfUserEmail?: string;
	/** The ID of the user to start the session on behalf of. Can't be combined with onBehalfOfUserEmail. */
	onBehalfOfUserId?: string;
};

export type UpdateAgentVaultSessionOptions = {
	/** The new label, up to 128 characters, without line breaks, tabs, or invisible characters. Pass null or an empty string to remove the label. You can't change the label once the session's owner, or the user it was started on behalf of, is deleted. */
	label: string | null;
};

export type ListAgentVaultAccessBundlesOptions = {
	/** The ID of the Agent Vault project to list access bundles from. */
	projectId: string;
	/** Match access bundles by name or description. */
	search?: string;
	/** true lists only the access bundles with services that still need your personal values, and false lists the rest. Defaults to both. */
	requiresSetup?: boolean;
	/** true lists only the access bundles granted to you, directly or through a group, and false lists the ones you reach only as an admin. Defaults to both. Can't be combined with onBehalfOfUserEmail or onBehalfOfUserId. */
	granted?: boolean;
	/** As a machine identity whose delegation covers the user with this email address, list the access bundles that a session on the user's behalf could use: those both the user and your machine identity can use. requiresSetup and servicesRequiringSetup then refer to the user's personal values. Can't be combined with onBehalfOfUserId. */
	onBehalfOfUserEmail?: string;
	/** Like onBehalfOfUserEmail, naming the user by ID instead. Can't be combined with onBehalfOfUserEmail. */
	onBehalfOfUserId?: string;
	/** What to sort access bundles by. Defaults to "createdAt". */
	orderBy?: "name" | "serviceCount" | "createdAt";
	/** Which way to sort. Defaults to "desc". */
	orderDirection?: AgentVaultOrderDirection;
	/** The maximum number of access bundles to return (1-100). Defaults to 20. */
	limit?: number;
	/** How many access bundles to skip. Defaults to 0. */
	offset?: number;
};

export type CreateAgentVaultAccessBundleOptions = {
	/** The ID of the Agent Vault project to create the access bundle in. */
	projectId: string;
	/** The name of the access bundle (a slug, at most 64 characters). */
	name: string;
	/** What the access bundle is for, up to 256 characters, without line breaks or other control characters. */
	description?: string;
};

export type UpdateAgentVaultAccessBundleOptions = {
	/** The new name of the access bundle (a slug, at most 64 characters). */
	name?: string;
	/** The new description, up to 256 characters, without line breaks or other control characters. Pass an empty string to remove the description. */
	description?: string;
};

export type ListAgentVaultGranteesOptions = {
	/** List only users, only machine identities, or only groups. Defaults to all three. */
	actorType?: AgentVaultMemberType | `${AgentVaultMemberType}`;
	/** Match by name, username or email address. */
	search?: string;
	/** The maximum number to return (1-100). Defaults to 20. */
	limit?: number;
	/** How many to skip. Defaults to 0. */
	offset?: number;
};

export type GrantAgentVaultAccessBundleOptions = {
	/** The IDs of the users to grant the access bundle to. */
	userIds?: string[];
	/** The IDs of the machine identities to grant the access bundle to. */
	machineIdentityIds?: string[];
	/** The IDs of the groups to grant the access bundle to. */
	groupIds?: string[];
};

export type RevokeAgentVaultAccessBundleOptions = {
	/** The IDs of the users to revoke the access bundle from. */
	userIds?: string[];
	/** The IDs of the machine identities to revoke the access bundle from. */
	machineIdentityIds?: string[];
	/** The IDs of the groups to revoke the access bundle from. */
	groupIds?: string[];
};

export type ListAgentVaultDelegationsOptions = {
	/** The ID of the Agent Vault project to list delegations from. */
	projectId: string;
	/** Only return the delegations of these machine identities, up to 100. */
	machineIdentityIds?: string[];
	/** The maximum number of delegations to return (1-100). Defaults to 100. */
	limit?: number;
	/** How many delegations to skip. Defaults to 0. */
	offset?: number;
};

export type SetAgentVaultDelegationOptions = {
	/** The ID of the Agent Vault project the delegation belongs to. */
	projectId: string;
	/** "all-members" for every Agent Vault member, admins included, or "selected" for only the users and groups you name. */
	scope: AgentVaultDelegationScope | `${AgentVaultDelegationScope}`;
	/** With the "selected" scope, the users the machine identity can act on behalf of, up to 100. Each must be a member of Agent Vault. For a user who's in Agent Vault only through a group, name the group instead. */
	userIds?: string[];
	/** With the "selected" scope, the groups whose members the machine identity can act on behalf of, up to 100. Each must be a member of Agent Vault. */
	groupIds?: string[];
};

export type AddAgentVaultDelegationSubjectsOptions = {
	/** The ID of the Agent Vault project the delegation belongs to. */
	projectId: string;
	/** The users to add, up to 100. Each must be a member of Agent Vault. Users the delegation already names are skipped. */
	userIds?: string[];
	/** The groups to add, up to 100. Each must be a member of Agent Vault. Groups the delegation already names are skipped. */
	groupIds?: string[];
};

export type RemoveAgentVaultDelegationSubjectsOptions = {
	/** The ID of the Agent Vault project the delegation belongs to. */
	projectId: string;
	/** The users to take out, up to 100. Users the delegation doesn't name are skipped. */
	userIds?: string[];
	/** The groups to take out, up to 100. Groups the delegation doesn't name are skipped. */
	groupIds?: string[];
};

export type ListAvailableAgentVaultDelegationSubjectsOptions = {
	/** The ID of the Agent Vault project the delegation belongs to. */
	projectId: string;
	/** List only users or only groups. Defaults to both. */
	actorType?: AgentVaultMemberType.User | AgentVaultMemberType.Group | "user" | "group";
	/** Match users by name, username or email address, and groups by name. */
	search?: string;
	/** The maximum number of users and groups to return (1-100). Defaults to 20. */
	limit?: number;
	/** How many users and groups to skip. Defaults to 0. */
	offset?: number;
};
