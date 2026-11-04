import { AgentVaultApi } from "../api/endpoints/agent-vault";
import {
	AddAgentVaultDelegationSubjectsOptions,
	AgentVaultInlineService,
	AgentVaultSessionScope,
	AgentVaultTrafficPolicy,
	CreateAgentVaultAccessBundleOptions,
	CreateAgentVaultProxyOptions,
	CreateAgentVaultSessionOptions,
	CreateAgentVaultSessionRequest,
	GrantAgentVaultAccessBundleOptions,
	ListAgentVaultAccessBundlesOptions,
	ListAgentVaultDelegationsOptions,
	ListAgentVaultGranteesOptions,
	ListAgentVaultProxiesOptions,
	ListAgentVaultSessionsOptions,
	ListAvailableAgentVaultDelegationSubjectsOptions,
	RemoveAgentVaultDelegationSubjectsOptions,
	RevokeAgentVaultAccessBundleOptions,
	SetAgentVaultDelegationOptions,
	UpdateAgentVaultAccessBundleOptions,
	UpdateAgentVaultProxyOptions,
	UpdateAgentVaultSessionOptions
} from "../api/types/agent-vault";
import { InfisicalSDKError, newInfisicalError } from "./errors";

const isSet = <T>(value: T | null | undefined): value is T => value !== undefined && value !== null;

/** The API takes host patterns as one comma-separated string and rejects an empty one, so an empty value becomes null. */
const joinHosts = (allowedHosts: string | string[] | undefined): string | null | undefined => {
	if (!isSet(allowedHosts)) return undefined;
	const hosts = Array.isArray(allowedHosts) ? allowedHosts.join(",") : allowedHosts;
	return hosts.trim() ? hosts : null;
};

/** The API takes a list in a query parameter as one comma-separated string. */
const joinList = (values: string[] | undefined) => (values?.length ? values.join(",") : undefined);

/**
 * The old name of service-hosts. Infisical stores service-hosts under this name and still accepts it, while a version
 * from before the rename accepts and returns only this name.
 */
const SERVICE_HOSTS_OLD_NAME = "bundle-hosts";

/** Sends service-hosts by its old name, which every Infisical version accepts. */
const toWireTrafficPolicy = (trafficPolicy: AgentVaultTrafficPolicy | `${AgentVaultTrafficPolicy}` | undefined) =>
	trafficPolicy === AgentVaultTrafficPolicy.ServiceHosts ? SERVICE_HOSTS_OLD_NAME : trafficPolicy;

/** Reports the old name, which an Infisical version from before the rename returns, as service-hosts. */
const viewProxy = <T extends { trafficPolicy?: AgentVaultTrafficPolicy }>(proxy: T): T =>
	(proxy.trafficPolicy as string | undefined) === SERVICE_HOSTS_OLD_NAME
		? { ...proxy, trafficPolicy: AgentVaultTrafficPolicy.ServiceHosts }
		: proxy;

/** Gives a session from an Infisical version without inline services an empty list of them, rather than none. */
const withServices = <T extends { services: AgentVaultInlineService[] }>(session: T): T =>
	session.services ? session : { ...session, services: [] };

/** The API names a user by email address or by ID, not both. */
const checkOneUser = (onBehalfOfUserEmail: string | undefined, onBehalfOfUserId: string | undefined) => {
	if (isSet(onBehalfOfUserEmail) && isSet(onBehalfOfUserId)) {
		throw new InfisicalSDKError("Pass either onBehalfOfUserEmail or onBehalfOfUserId, not both");
	}
};

/** Runs an Agent Vault request and turns any failure into an Infisical SDK error. */
const run = async <T>(request: () => Promise<T>): Promise<T> => {
	try {
		return await request();
	} catch (err) {
		throw newInfisicalError(err);
	}
};

/** Manages Infisical Agent Vault. */
export default class AgentVaultClient {
	constructor(private apiClient: AgentVaultApi) {}

	/** Manages Agent Vault proxies. */
	proxies = {
		/**
		 * Lists the organization's Agent Vault proxies.
		 * @returns The proxies and totalCount. A proxy's settings are only set for admins.
		 */
		list: (options: ListAgentVaultProxiesOptions = {}) =>
			run(async () => {
				const res = await this.apiClient.proxies.list({
					search: options.search,
					orderBy: options.orderBy ?? "createdAt",
					orderDirection: options.orderDirection ?? "desc",
					limit: options.limit ?? 20,
					offset: options.offset ?? 0
				});
				return { ...res, proxies: res.proxies.map(viewProxy) };
			}),

		/**
		 * Registers an Agent Vault proxy and issues its proxy token.
		 * @returns The proxy and its proxyToken. The token is only returned once.
		 */
		create: (options: CreateAgentVaultProxyOptions) =>
			run(async () => {
				const res = await this.apiClient.proxies.create({
					name: options.name,
					trafficPolicy: toWireTrafficPolicy(options.trafficPolicy) ?? AgentVaultTrafficPolicy.AnyHost,
					// An empty value means no allowed hosts, so it's left out.
					allowedHosts: joinHosts(options.allowedHosts) ?? undefined,
					pollInterval: options.pollInterval ?? 60,
					description: options.description
				});
				return { ...res, proxy: viewProxy(res.proxy) };
			}),

		/**
		 * Updates an Agent Vault proxy's name, description or settings. Only the values you pass are changed.
		 * @returns The updated proxy.
		 */
		update: (proxyId: string, options: UpdateAgentVaultProxyOptions) =>
			run(async () => {
				const res = await this.apiClient.proxies.update(proxyId, {
					name: options.name,
					trafficPolicy: toWireTrafficPolicy(options.trafficPolicy),
					// An empty value removes every allowed host, which the API takes as null.
					allowedHosts: joinHosts(options.allowedHosts),
					pollInterval: options.pollInterval,
					description: options.description
				});
				return viewProxy(res.proxy);
			}),

		/**
		 * Deletes an Agent Vault proxy.
		 * @returns The deleted proxy's id and name.
		 */
		delete: (proxyId: string) =>
			run(async () => {
				const res = await this.apiClient.proxies.delete(proxyId);
				return res.proxy;
			}),

		/**
		 * Issues a new proxy token. The proxy's earlier tokens stop working and it gets a new certificate authority.
		 * @returns The proxy and its new proxyToken. The token is only returned once.
		 */
		rotateToken: (proxyId: string) =>
			run(async () => {
				const res = await this.apiClient.proxies.rotateToken(proxyId);
				return { ...res, proxy: viewProxy(res.proxy) };
			}),

		/**
		 * Revokes an Agent Vault proxy's token. Rotate its token to bring it back.
		 * @returns The revoked proxy.
		 */
		revoke: (proxyId: string) =>
			run(async () => {
				const res = await this.apiClient.proxies.revoke(proxyId);
				return viewProxy(res.proxy);
			})
	};

	/** Manages Agent Vault sessions. */
	sessions = {
		/**
		 * Lists Agent Vault sessions.
		 * @returns The sessions and totalCount.
		 */
		list: (options: ListAgentVaultSessionsOptions = {}) =>
			run(async () => {
				const res = await this.apiClient.sessions.list({
					scope: options.scope ?? AgentVaultSessionScope.Mine,
					status: joinList(options.statuses),
					search: options.search,
					limit: options.limit ?? 20,
					offset: options.offset ?? 0
				});
				return { ...res, sessions: res.sessions.map(withServices) };
			}),

		/**
		 * Gets an Agent Vault session.
		 * @returns The session.
		 */
		get: (sessionId: string) =>
			run(async () => {
				const res = await this.apiClient.sessions.get(sessionId);
				return withServices(res.session);
			}),

		/**
		 * Creates an Agent Vault session with an access bundle you can reach, services of its own, or both, for yourself
		 * or, as a machine identity with a delegation, on behalf of a user.
		 *
		 * Only Agent Vault admins can send services with a session. On behalf of a user, that's your machine identity:
		 * the user doesn't need the Admin role, and the services don't use the user's personal values.
		 *
		 * To start a session on behalf of a user, you must be a machine identity whose delegation covers the user. The
		 * proxy then uses the user's personal values, and the session can use only an access bundle that both the user
		 * and your machine identity can use. The session still belongs to your machine identity, so the user can't see
		 * it unless they're an Agent Vault admin.
		 * @returns The created session, including its token. The token is only returned once.
		 */
		create: (options: CreateAgentVaultSessionOptions) =>
			run(async () => {
				checkOneUser(options.onBehalfOfUserEmail, options.onBehalfOfUserId);

				// An empty email or ID is sent rather than dropped, so the server rejects it instead of the SDK
				// quietly creating the session for the caller.
				let onBehalfOf: CreateAgentVaultSessionRequest["onBehalfOf"];
				if (isSet(options.onBehalfOfUserEmail)) {
					onBehalfOf = { userEmail: options.onBehalfOfUserEmail };
				} else if (isSet(options.onBehalfOfUserId)) {
					onBehalfOf = { userId: options.onBehalfOfUserId };
				}

				const res = await this.apiClient.sessions.create({
					// Left out without an access bundle, for a session that carries only services of its own.
					accessBundles: isSet(options.accessBundle) ? [options.accessBundle] : undefined,
					services: options.services,
					// Left out unless you pass it, so the server picks the default: 7d, or 1h on behalf of a user.
					ttl: options.ttl,
					label: options.label,
					onBehalfOf
				});
				return withServices(res.session);
			}),

		/**
		 * Updates the label of an Agent Vault session. This also works after the session expires or is revoked.
		 * @returns The updated session.
		 */
		update: (sessionId: string, options: UpdateAgentVaultSessionOptions) =>
			run(async () => {
				// The label is always sent: null removes it, and the API rejects a request without one.
				const res = await this.apiClient.sessions.update(sessionId, { label: options.label });
				return withServices(res.session);
			}),

		/**
		 * Revokes an Agent Vault session. Revoking an already revoked session changes nothing.
		 * @returns The revoked session. The response leaves out its access bundles and inline services; call get for them.
		 */
		revoke: (sessionId: string) =>
			run(async () => {
				const res = await this.apiClient.sessions.revoke(sessionId);
				return res.session;
			})
	};

	/**
	 * Manages Agent Vault access bundles and who they're granted to. Every method except list and get requires the
	 * Admin role in Agent Vault.
	 */
	accessBundles = {
		/**
		 * Lists the Agent Vault access bundles you can reach. Admins reach every access bundle.
		 * @returns The access bundles and totalCount.
		 */
		list: (options: ListAgentVaultAccessBundlesOptions = {}) =>
			run(() => {
				checkOneUser(options.onBehalfOfUserEmail, options.onBehalfOfUserId);

				return this.apiClient.accessBundles.list({
					search: options.search,
					requiresSetup: options.requiresSetup,
					granted: options.granted,
					onBehalfOfUserEmail: options.onBehalfOfUserEmail,
					onBehalfOfUserId: options.onBehalfOfUserId,
					orderBy: options.orderBy ?? "createdAt",
					orderDirection: options.orderDirection ?? "desc",
					limit: options.limit ?? 20,
					offset: options.offset ?? 0
				});
			}),

		/**
		 * Gets an Agent Vault access bundle you can reach, with its services.
		 * @returns The access bundle, with its services. A service's variableReferences is only set for admins.
		 */
		get: (accessBundleId: string) =>
			run(async () => {
				const res = await this.apiClient.accessBundles.get(accessBundleId);
				return res.accessBundle;
			}),

		/**
		 * Creates an Agent Vault access bundle. It's granted to you, unless you're in Agent Vault only through a group.
		 * @returns The created access bundle.
		 */
		create: (options: CreateAgentVaultAccessBundleOptions) =>
			run(async () => {
				const res = await this.apiClient.accessBundles.create({
					name: options.name,
					description: options.description
				});
				return res.accessBundle;
			}),

		/**
		 * Updates an Agent Vault access bundle's name or description. Only the values you pass are changed.
		 * @returns The updated access bundle.
		 */
		update: (accessBundleId: string, options: UpdateAgentVaultAccessBundleOptions) =>
			run(async () => {
				const res = await this.apiClient.accessBundles.update(accessBundleId, {
					name: options.name,
					description: options.description
				});
				return res.accessBundle;
			}),

		/**
		 * Deletes an Agent Vault access bundle.
		 * @returns The deleted access bundle.
		 */
		delete: (accessBundleId: string) =>
			run(async () => {
				const res = await this.apiClient.accessBundles.delete(accessBundleId);
				return res.accessBundle;
			}),

		/**
		 * Lists the users, machine identities and groups that an Agent Vault access bundle is granted to.
		 * @returns The grantees in members, and totalCount.
		 */
		listGrantees: (accessBundleId: string, options: ListAgentVaultGranteesOptions = {}) =>
			run(() =>
				this.apiClient.accessBundles.listGrantees(accessBundleId, {
					search: options.search,
					limit: options.limit ?? 20,
					offset: options.offset ?? 0
				})
			),

		/**
		 * Lists the Agent Vault members that an access bundle isn't granted to yet, so you can grant it to them.
		 * @returns The members and totalCount.
		 */
		listAvailableGrantees: (accessBundleId: string, options: ListAgentVaultGranteesOptions = {}) =>
			run(() =>
				this.apiClient.accessBundles.listAvailableGrantees(accessBundleId, {
					search: options.search,
					limit: options.limit ?? 20,
					offset: options.offset ?? 0
				})
			),

		/**
		 * Grants an Agent Vault access bundle to users, machine identities or groups. Each must be a member of Agent
		 * Vault. Name at least one, and at most 100 in total.
		 * @returns The new grants in members, and the grantees that already had the access bundle in skipped.
		 */
		grant: (accessBundleId: string, options: GrantAgentVaultAccessBundleOptions) =>
			run(() =>
				this.apiClient.accessBundles.grant(accessBundleId, {
					userIds: options.userIds,
					machineIdentityIds: options.machineIdentityIds,
					groupIds: options.groupIds
				})
			),

		/**
		 * Revokes an Agent Vault access bundle from users, machine identities or groups. Name at least one, and at most
		 * 100 in total.
		 * @returns The revoked grants in members, and the grantees that didn't have the access bundle in skipped.
		 */
		revoke: (accessBundleId: string, options: RevokeAgentVaultAccessBundleOptions) =>
			run(() =>
				this.apiClient.accessBundles.revoke(accessBundleId, {
					userIds: options.userIds,
					machineIdentityIds: options.machineIdentityIds,
					groupIds: options.groupIds
				})
			)
	};

	/**
	 * Manages Agent Vault delegations, which let machine identities create sessions on behalf of users. Every method
	 * requires the Admin role in Agent Vault, except that a machine identity can get its own delegation.
	 */
	delegations = {
		/**
		 * Lists the machine identities that can create Agent Vault sessions on behalf of users.
		 * @returns The delegations and totalCount. A listed delegation has no missingAccessBundles; call get for them.
		 */
		list: (options: ListAgentVaultDelegationsOptions = {}) =>
			run(() =>
				this.apiClient.delegations.list({
					machineIdentityIds: joinList(options.machineIdentityIds),
					limit: options.limit ?? 100,
					offset: options.offset ?? 0
				})
			),

		/**
		 * Gets which users a machine identity can create Agent Vault sessions on behalf of. Fails with status 404 if the
		 * machine identity has no delegation.
		 * @returns The delegation, with the access bundles the machine identity can't create sessions over.
		 */
		get: (machineIdentityId: string) =>
			run(async () => {
				const res = await this.apiClient.delegations.get(machineIdentityId);
				return res.delegation;
			}),

		/**
		 * Sets which users a machine identity can create Agent Vault sessions on behalf of, replacing any delegation it
		 * has. The machine identity must be a member of Agent Vault.
		 * @returns The saved delegation, with missingAccessBundles.
		 */
		set: (machineIdentityId: string, options: SetAgentVaultDelegationOptions) =>
			run(async () => {
				const res = await this.apiClient.delegations.set(machineIdentityId, {
					scope: options.scope,
					userIds: options.userIds,
					groupIds: options.groupIds
				});
				return res.delegation;
			}),

		/**
		 * Stops a machine identity from creating Agent Vault sessions on behalf of users. The sessions it already created
		 * on their behalf stop working.
		 * @returns The deleted delegation, without missingAccessBundles.
		 */
		delete: (machineIdentityId: string) =>
			run(async () => {
				const res = await this.apiClient.delegations.delete(machineIdentityId);
				return res.delegation;
			}),

		/**
		 * Adds users and groups to a machine identity's delegation, keeping the ones it already names. If the machine
		 * identity has no delegation, this creates one with the "selected" scope. A delegation to all members can't
		 * take users or groups.
		 * @returns The delegation after the change, with missingAccessBundles.
		 */
		addSubjects: (machineIdentityId: string, options: AddAgentVaultDelegationSubjectsOptions) =>
			run(async () => {
				const res = await this.apiClient.delegations.addSubjects(machineIdentityId, {
					userIds: options.userIds,
					groupIds: options.groupIds
				});
				return res.delegation;
			}),

		/**
		 * Takes users and groups out of a machine identity's delegation. The sessions it created on behalf of the users
		 * you take out stop working, and taking out the last user or group removes the delegation.
		 * @returns The delegation after the change, with missingAccessBundles, or null if it no longer names anyone.
		 */
		removeSubjects: (machineIdentityId: string, options: RemoveAgentVaultDelegationSubjectsOptions) =>
			run(async () => {
				const res = await this.apiClient.delegations.removeSubjects(machineIdentityId, {
					userIds: options.userIds,
					groupIds: options.groupIds
				});
				return res.delegation;
			}),

		/**
		 * Lists the Agent Vault users and groups that can still be added to a machine identity's delegation. The machine
		 * identity must be a member of Agent Vault.
		 * @returns The users and groups in members, and totalCount.
		 */
		listAvailableSubjects: (machineIdentityId: string, options: ListAvailableAgentVaultDelegationSubjectsOptions = {}) =>
			run(() =>
				this.apiClient.delegations.listAvailableSubjects(machineIdentityId, {
					actorType: options.actorType,
					search: options.search,
					limit: options.limit ?? 20,
					offset: options.offset ?? 0
				})
			)
	};
}
