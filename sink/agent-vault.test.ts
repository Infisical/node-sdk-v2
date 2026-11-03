import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { InfisicalSDK } from "../src";
import {
	AgentVaultDelegationScope,
	AgentVaultMemberType,
	AgentVaultSessionScope,
	AgentVaultSessionStatus,
	AgentVaultTrafficPolicy
} from "../src/api/types/agent-vault";
import { InfisicalSDKError } from "../src/custom/errors";

type AgentVault = ReturnType<InfisicalSDK["agentVault"]>;

const PROXY_ID = "a2b5e0d1-6f3e-4c55-9a43-3f0c1f0a2b7e";
const SESSION_ID = "6f1c2a9e-3b7d-4e8a-9c41-2d5f7b8e0a13";
const BUNDLE_ID = "5e2d8c1a-7b3f-4a9e-8d6c-1f0b2a3c4d5e";
const SERVICE_ID = "3a5c7e9b-2d4f-4a6c-8e1b-5d7f9a2c4e6b";
const MACHINE_IDENTITY_ID = "9c4b2a1d-3e5f-4a6b-8c7d-2e1f0a9b8c7d";
const OTHER_MACHINE_IDENTITY_ID = "2f6e8a4c-1b3d-4c5e-9f7a-6b8c0d2e4f1a";
const USER_ID = "0d9a7c3e-5b1f-4e2a-8c6d-7f4b2e1a9c50";
const USER_EMAIL = "jsmith@example.com";
const GROUP_ID = "7b1e4f2a-9c3d-4a6b-8e5f-1d2c3b4a5e6f";
const CREATED_AT = "2026-10-27T00:00:00.000Z";

const PROXY = {
	id: PROXY_ID,
	name: "edge-proxy",
	description: null,
	heartbeat: null,
	isHealthy: false,
	rootCaFingerprint: "AB:CD:EF",
	rootCaExpiresAt: "2036-10-27T00:00:00.000Z",
	trafficPolicy: "any-host",
	allowedHosts: null,
	pollInterval: 60,
	createdAt: CREATED_AT
};
const USER = { id: USER_ID, username: USER_EMAIL, email: USER_EMAIL, firstName: "Jane", lastName: "Smith" };
const SESSION_ACCESS_BUNDLES = [{ id: BUNDLE_ID, name: "release", position: 0 }];
const SESSION = {
	id: SESSION_ID,
	label: null,
	actor: { type: "machineIdentity", id: MACHINE_IDENTITY_ID, name: "slack-bot" },
	onBehalfOf: { type: "user", ...USER },
	status: "active",
	expiresAt: "2026-10-27T01:00:00.000Z",
	revokedAt: null,
	createdAt: CREATED_AT,
	accessBundles: SESSION_ACCESS_BUNDLES
};
const CREATED_SESSION = {
	id: SESSION_ID,
	label: null,
	token: "session-token",
	expiresAt: SESSION.expiresAt,
	createdAt: CREATED_AT,
	accessBundles: SESSION_ACCESS_BUNDLES
};
const BUNDLE = { id: BUNDLE_ID, name: "release", description: null, createdAt: CREATED_AT, updatedAt: CREATED_AT };
const SERVICE = {
	id: SERVICE_ID,
	accessBundleId: BUNDLE_ID,
	name: "github",
	type: "http",
	serverUrl: null,
	transport: null,
	hostPattern: "api.github.com",
	allowedMethods: null,
	allowedPathPrefixes: null,
	credential: { type: "bearer", memberProvidedFields: [] },
	customHeaders: [],
	substitutions: [],
	personalValues: null,
	createdAt: CREATED_AT,
	updatedAt: CREATED_AT
};
const DELEGATION = {
	machineIdentity: { id: MACHINE_IDENTITY_ID, name: "slack-bot" },
	scope: "selected",
	users: [{ ...USER, addedAt: CREATED_AT }],
	groups: [{ id: GROUP_ID, name: "Engineering", addedAt: CREATED_AT }],
	createdAt: CREATED_AT,
	updatedAt: CREATED_AT
};
const MISSING_ACCESS_BUNDLES = [{ id: BUNDLE_ID, name: "release" }];
const DELEGATION_DETAIL = {
	...DELEGATION,
	users: [{ ...DELEGATION.users[0], missingAccessBundles: MISSING_ACCESS_BUNDLES }],
	groups: [{ ...DELEGATION.groups[0], missingAccessBundles: [] }],
	missingAccessBundles: MISSING_ACCESS_BUNDLES
};
const AVAILABLE_MEMBER = { type: "group", id: GROUP_ID, name: "Engineering", role: "member", isActive: true, addedAt: CREATED_AT };

let fetchSpy: ReturnType<typeof vi.fn>;
let agentVault: AgentVault;

const respondWith = (payload: unknown) => {
	fetchSpy.mockImplementation(async () => new Response(JSON.stringify(payload), { status: 200 }));
};

const lastRequest = () => {
	const [url, init] = fetchSpy.mock.calls.at(-1) as [string, RequestInit];
	const { pathname, searchParams } = new URL(url);
	return {
		method: init.method,
		path: pathname,
		query: Object.fromEntries(searchParams),
		body: init.body === undefined ? undefined : JSON.parse(init.body as string)
	};
};

beforeEach(() => {
	fetchSpy = vi.fn();
	vi.stubGlobal("fetch", fetchSpy);
	agentVault = new InfisicalSDK({ siteUrl: "https://infisical.example.com" }).agentVault();
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

// Every method, with the route it calls in the Infisical API, the request it sends with only the required
// arguments, and what it returns from the response.
const ROUTES: {
	name: string;
	call: (agentVault: AgentVault) => Promise<unknown>;
	method: string;
	path: string;
	query?: Record<string, string>;
	body?: unknown;
	response: unknown;
	returns: (response: any) => unknown;
}[] = [
	{
		name: "proxies.list",
		call: (av) => av.proxies.list(),
		method: "GET",
		path: "/proxies",
		query: { orderBy: "createdAt", orderDirection: "desc", limit: "20", offset: "0" },
		response: { proxies: [PROXY], totalCount: 1 },
		returns: (res) => res
	},
	{
		name: "proxies.create",
		call: (av) => av.proxies.create({ name: "edge-proxy" }),
		method: "POST",
		path: "/proxies",
		body: { name: "edge-proxy", trafficPolicy: "any-host", pollInterval: 60 },
		response: { proxy: PROXY, proxyToken: "proxy-token" },
		returns: (res) => res
	},
	{
		name: "proxies.update",
		call: (av) => av.proxies.update(PROXY_ID, { pollInterval: 30 }),
		method: "PATCH",
		path: `/proxies/${PROXY_ID}`,
		body: { pollInterval: 30 },
		response: { proxy: { ...PROXY, pollInterval: 30 } },
		returns: (res) => res.proxy
	},
	{
		name: "proxies.delete",
		call: (av) => av.proxies.delete(PROXY_ID),
		method: "DELETE",
		path: `/proxies/${PROXY_ID}`,
		response: { proxy: { id: PROXY_ID, name: "edge-proxy" } },
		returns: (res) => res.proxy
	},
	{
		name: "proxies.rotateToken",
		call: (av) => av.proxies.rotateToken(PROXY_ID),
		method: "POST",
		path: `/proxies/${PROXY_ID}/token-auth/proxy-token`,
		response: { proxy: PROXY, proxyToken: "new-proxy-token" },
		returns: (res) => res
	},
	{
		name: "proxies.revoke",
		call: (av) => av.proxies.revoke(PROXY_ID),
		method: "POST",
		path: `/proxies/${PROXY_ID}/revoke`,
		response: { proxy: PROXY },
		returns: (res) => res.proxy
	},
	{
		name: "sessions.list",
		call: (av) => av.sessions.list(),
		method: "GET",
		path: "/sessions",
		query: { scope: "mine", limit: "20", offset: "0" },
		response: { sessions: [SESSION], totalCount: 1 },
		returns: (res) => res
	},
	{
		name: "sessions.get",
		call: (av) => av.sessions.get(SESSION_ID),
		method: "GET",
		path: `/sessions/${SESSION_ID}`,
		response: { session: SESSION },
		returns: (res) => res.session
	},
	{
		name: "sessions.create",
		call: (av) => av.sessions.create({ accessBundle: "release" }),
		method: "POST",
		path: "/sessions",
		body: { accessBundles: ["release"] },
		response: { session: CREATED_SESSION },
		returns: (res) => res.session
	},
	{
		name: "sessions.update",
		call: (av) => av.sessions.update(SESSION_ID, { label: "nightly deploy" }),
		method: "PATCH",
		path: `/sessions/${SESSION_ID}`,
		body: { label: "nightly deploy" },
		response: { session: { ...SESSION, label: "nightly deploy" } },
		returns: (res) => res.session
	},
	{
		name: "sessions.revoke",
		call: (av) => av.sessions.revoke(SESSION_ID),
		method: "POST",
		path: `/sessions/${SESSION_ID}/revoke`,
		response: { session: { ...SESSION, accessBundles: undefined, status: "revoked", revokedAt: CREATED_AT } },
		returns: (res) => res.session
	},
	{
		name: "accessBundles.list",
		call: (av) => av.accessBundles.list(),
		method: "GET",
		path: "/access-bundles",
		query: { orderBy: "createdAt", orderDirection: "desc", limit: "20", offset: "0" },
		response: {
			accessBundles: [
				{
					...BUNDLE,
					serviceCount: 1,
					memberCount: 2,
					hostPatterns: ["api.github.com"],
					servicesRequiringSetup: [{ id: SERVICE_ID, name: "github" }]
				}
			],
			totalCount: 1
		},
		returns: (res) => res
	},
	{
		name: "accessBundles.get",
		call: (av) => av.accessBundles.get(BUNDLE_ID),
		method: "GET",
		path: `/access-bundles/${BUNDLE_ID}`,
		response: { accessBundle: { ...BUNDLE, services: [SERVICE] } },
		returns: (res) => res.accessBundle
	},
	{
		name: "accessBundles.create",
		call: (av) => av.accessBundles.create({ name: "release" }),
		method: "POST",
		path: "/access-bundles",
		body: { name: "release" },
		response: { accessBundle: BUNDLE },
		returns: (res) => res.accessBundle
	},
	{
		name: "accessBundles.update",
		call: (av) => av.accessBundles.update(BUNDLE_ID, { name: "release-2" }),
		method: "PATCH",
		path: `/access-bundles/${BUNDLE_ID}`,
		body: { name: "release-2" },
		response: { accessBundle: { ...BUNDLE, name: "release-2" } },
		returns: (res) => res.accessBundle
	},
	{
		name: "accessBundles.delete",
		call: (av) => av.accessBundles.delete(BUNDLE_ID),
		method: "DELETE",
		path: `/access-bundles/${BUNDLE_ID}`,
		response: { accessBundle: BUNDLE },
		returns: (res) => res.accessBundle
	},
	{
		name: "accessBundles.listGrantees",
		call: (av) => av.accessBundles.listGrantees(BUNDLE_ID),
		method: "GET",
		path: `/access-bundles/${BUNDLE_ID}/members`,
		query: { limit: "20", offset: "0" },
		response: { members: [{ type: "user", ...USER, grantedAt: CREATED_AT }], totalCount: 1 },
		returns: (res) => res
	},
	{
		name: "accessBundles.listAvailableGrantees",
		call: (av) => av.accessBundles.listAvailableGrantees(BUNDLE_ID),
		method: "GET",
		path: `/access-bundles/${BUNDLE_ID}/members/available`,
		query: { limit: "20", offset: "0" },
		response: { members: [AVAILABLE_MEMBER], totalCount: 1 },
		returns: (res) => res
	},
	{
		name: "accessBundles.grant",
		call: (av) => av.accessBundles.grant(BUNDLE_ID, { userIds: [USER_ID] }),
		method: "POST",
		path: `/access-bundles/${BUNDLE_ID}/members`,
		body: { userIds: [USER_ID] },
		response: { members: [{ type: "user", id: USER_ID, grantedAt: CREATED_AT }], skipped: [] },
		returns: (res) => res
	},
	{
		name: "accessBundles.revoke",
		call: (av) => av.accessBundles.revoke(BUNDLE_ID, { groupIds: [GROUP_ID] }),
		method: "DELETE",
		path: `/access-bundles/${BUNDLE_ID}/members`,
		body: { groupIds: [GROUP_ID] },
		response: { members: [{ type: "group", id: GROUP_ID }], skipped: [] },
		returns: (res) => res
	},
	{
		name: "delegations.list",
		call: (av) => av.delegations.list(),
		method: "GET",
		path: "/delegations",
		query: { limit: "100", offset: "0" },
		response: { delegations: [DELEGATION], totalCount: 1 },
		returns: (res) => res
	},
	{
		name: "delegations.get",
		call: (av) => av.delegations.get(MACHINE_IDENTITY_ID),
		method: "GET",
		path: `/delegations/${MACHINE_IDENTITY_ID}`,
		response: { delegation: DELEGATION_DETAIL },
		returns: (res) => res.delegation
	},
	{
		name: "delegations.set",
		call: (av) => av.delegations.set(MACHINE_IDENTITY_ID, { scope: AgentVaultDelegationScope.AllMembers }),
		method: "PUT",
		path: `/delegations/${MACHINE_IDENTITY_ID}`,
		body: { scope: "all-members" },
		response: { delegation: { ...DELEGATION_DETAIL, scope: "all-members", users: [], groups: [] } },
		returns: (res) => res.delegation
	},
	{
		name: "delegations.delete",
		call: (av) => av.delegations.delete(MACHINE_IDENTITY_ID),
		method: "DELETE",
		path: `/delegations/${MACHINE_IDENTITY_ID}`,
		response: { delegation: DELEGATION },
		returns: (res) => res.delegation
	},
	{
		name: "delegations.addSubjects",
		call: (av) => av.delegations.addSubjects(MACHINE_IDENTITY_ID, { userIds: [USER_ID] }),
		method: "POST",
		path: `/delegations/${MACHINE_IDENTITY_ID}/subjects`,
		body: { userIds: [USER_ID] },
		response: { delegation: DELEGATION_DETAIL },
		returns: (res) => res.delegation
	},
	{
		name: "delegations.removeSubjects",
		call: (av) => av.delegations.removeSubjects(MACHINE_IDENTITY_ID, { groupIds: [GROUP_ID] }),
		method: "DELETE",
		path: `/delegations/${MACHINE_IDENTITY_ID}/subjects`,
		body: { groupIds: [GROUP_ID] },
		response: { delegation: { ...DELEGATION_DETAIL, groups: [] } },
		returns: (res) => res.delegation
	},
	{
		name: "delegations.listAvailableSubjects",
		call: (av) => av.delegations.listAvailableSubjects(MACHINE_IDENTITY_ID),
		method: "GET",
		path: `/delegations/${MACHINE_IDENTITY_ID}/subjects/available`,
		query: { limit: "20", offset: "0" },
		response: { members: [AVAILABLE_MEMBER], totalCount: 1 },
		returns: (res) => res
	}
];

describe("agent vault routes", () => {
	it.each(ROUTES)("$name sends $method $path", async ({ call, method, path, query, body, response, returns }) => {
		respondWith(response);
		const result = await call(agentVault);
		expect(lastRequest()).toEqual({ method, path: `/api/v1/agent-vault${path}`, query: query ?? {}, body });
		expect(result).toEqual(returns(response));
	});
});

describe("agent vault proxies", () => {
	it.each([[[]], [""], ["  "]])("update sends null to remove every allowed host when given %j", async (allowedHosts) => {
		respondWith({ proxy: PROXY });
		await agentVault.proxies.update(PROXY_ID, { allowedHosts });
		expect(lastRequest().body).toEqual({ allowedHosts: null });
	});

	it("update leaves out the values you don't pass", async () => {
		respondWith({ proxy: PROXY });
		await agentVault.proxies.update(PROXY_ID, { name: "edge-proxy" });
		expect(lastRequest().body).toEqual({ name: "edge-proxy" });
	});

	it("create sends and returns the description", async () => {
		respondWith({ proxy: { ...PROXY, description: "Edge traffic" }, proxyToken: "proxy-token" });
		const created = await agentVault.proxies.create({ name: "edge-proxy", description: "Edge traffic" });
		expect(lastRequest().body.description).toBe("Edge traffic");
		expect(created.proxy.description).toBe("Edge traffic");
	});

	it.each([
		{ name: "description", options: { description: "" }, body: { description: "" } },
		{
			name: "description and allowed hosts",
			options: { description: "", allowedHosts: [] },
			body: { description: "", allowedHosts: null }
		}
	])("update sends an empty description to remove it ($name)", async ({ options, body }) => {
		respondWith({ proxy: PROXY });
		await agentVault.proxies.update(PROXY_ID, options);
		expect(lastRequest().body).toEqual(body);
	});

	it.each([[[]], [""]])("create leaves out empty allowed hosts when given %j", async (allowedHosts) => {
		respondWith({ proxy: PROXY, proxyToken: "proxy-token" });
		await agentVault.proxies.create({ name: "edge-proxy", allowedHosts });
		expect(lastRequest().body).not.toHaveProperty("allowedHosts");
	});

	it("create joins a list of allowed hosts into the comma-separated string the API takes", async () => {
		respondWith({ proxy: PROXY, proxyToken: "proxy-token" });
		await agentVault.proxies.create({
			name: "edge-proxy",
			trafficPolicy: AgentVaultTrafficPolicy.BundleHosts,
			allowedHosts: ["api.github.com", "*.slack.com"]
		});
		expect(lastRequest().body).toMatchObject({ trafficPolicy: "bundle-hosts", allowedHosts: "api.github.com,*.slack.com" });
	});
});

describe("agent vault sessions", () => {
	it.each(["nightly deploy", null])("update always sends the label (%j)", async (label) => {
		respondWith({ session: { ...SESSION, label } });
		const updated = await agentVault.sessions.update(SESSION_ID, { label });
		expect(lastRequest().body).toEqual({ label });
		expect(updated.label).toBe(label);
	});

	it("create leaves out ttl so the server picks the default", async () => {
		respondWith({ session: CREATED_SESSION });
		await agentVault.sessions.create({ accessBundle: "release" });
		expect(lastRequest().body).toEqual({ accessBundles: ["release"] });
	});

	it.each([
		{ name: "email", options: { onBehalfOfUserEmail: USER_EMAIL }, onBehalfOf: { userEmail: USER_EMAIL } },
		{ name: "ID", options: { onBehalfOfUserId: USER_ID }, onBehalfOf: { userId: USER_ID } },
		{ name: "empty email", options: { onBehalfOfUserEmail: "" }, onBehalfOf: { userEmail: "" } }
	])("create names the user it acts for by $name", async ({ options, onBehalfOf }) => {
		respondWith({ session: CREATED_SESSION });
		await agentVault.sessions.create({ accessBundle: "release", ...options });
		expect(lastRequest().body).toEqual({ accessBundles: ["release"], onBehalfOf });
	});

	it("create rejects both a user email and a user ID before sending a request", async () => {
		const created = agentVault.sessions.create({
			accessBundle: "release",
			onBehalfOfUserEmail: USER_EMAIL,
			onBehalfOfUserId: USER_ID
		});
		await expect(created).rejects.toThrow(InfisicalSDKError);
		await expect(created).rejects.toThrow("not both");
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it("list takes enum values or their strings, and joins the statuses", async () => {
		respondWith({ sessions: [], totalCount: 0 });
		await agentVault.sessions.list({
			scope: AgentVaultSessionScope.All,
			statuses: [AgentVaultSessionStatus.Active, "expired"]
		});
		expect(lastRequest().query).toMatchObject({ scope: "all", status: "active,expired" });
	});
});

describe("agent vault access bundles", () => {
	it("list sends booleans the way the API reads them", async () => {
		respondWith({ accessBundles: [], totalCount: 0 });
		await agentVault.accessBundles.list({ requiresSetup: true, granted: false });
		expect(lastRequest().query).toMatchObject({ requiresSetup: "true", granted: "false" });
	});

	it("list names the user a session would act for", async () => {
		respondWith({ accessBundles: [], totalCount: 0 });
		await agentVault.accessBundles.list({ onBehalfOfUserEmail: USER_EMAIL });
		const { query } = lastRequest();
		expect(query.onBehalfOfUserEmail).toBe(USER_EMAIL);
		expect(query).not.toHaveProperty("onBehalfOfUserId");
	});

	it("list rejects both a user email and a user ID before sending a request", async () => {
		const listed = agentVault.accessBundles.list({ onBehalfOfUserEmail: USER_EMAIL, onBehalfOfUserId: USER_ID });
		await expect(listed).rejects.toThrow("not both");
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it("update sends an empty description to remove it", async () => {
		respondWith({ accessBundle: BUNDLE });
		await agentVault.accessBundles.update(BUNDLE_ID, { description: "" });
		expect(lastRequest().body).toEqual({ description: "" });
	});

	it("grant and revoke send only the grantees you name", async () => {
		respondWith({ members: [{ type: "machineIdentity", id: MACHINE_IDENTITY_ID, grantedAt: CREATED_AT }], skipped: [] });
		await agentVault.accessBundles.grant(BUNDLE_ID, { machineIdentityIds: [MACHINE_IDENTITY_ID] });
		expect(lastRequest()).toMatchObject({ method: "POST", body: { machineIdentityIds: [MACHINE_IDENTITY_ID] } });

		respondWith({ members: [{ type: "user", id: USER_ID }], skipped: [] });
		const revoked = await agentVault.accessBundles.revoke(BUNDLE_ID, { userIds: [USER_ID] });
		expect(lastRequest()).toMatchObject({ method: "DELETE", body: { userIds: [USER_ID] } });
		expect(revoked.members).toEqual([{ type: "user", id: USER_ID }]);
	});
});

describe("agent vault delegations", () => {
	it("set puts the scope value", async () => {
		respondWith({ delegation: DELEGATION_DETAIL });
		await agentVault.delegations.set(MACHINE_IDENTITY_ID, {
			scope: AgentVaultDelegationScope.Selected,
			groupIds: [GROUP_ID]
		});
		expect(lastRequest()).toMatchObject({ method: "PUT", body: { scope: "selected", groupIds: [GROUP_ID] } });
	});

	it("list joins the machine identity IDs", async () => {
		respondWith({ delegations: [DELEGATION], totalCount: 1 });
		await agentVault.delegations.list({ machineIdentityIds: [MACHINE_IDENTITY_ID, OTHER_MACHINE_IDENTITY_ID] });
		expect(lastRequest().query.machineIdentityIds).toBe(`${MACHINE_IDENTITY_ID},${OTHER_MACHINE_IDENTITY_ID}`);
	});

	it("removeSubjects returns null once the last one is gone", async () => {
		respondWith({ delegation: null });
		const delegation = await agentVault.delegations.removeSubjects(MACHINE_IDENTITY_ID, { userIds: [USER_ID] });
		expect(delegation).toBeNull();
		expect(lastRequest().body).toEqual({ userIds: [USER_ID] });
	});

	it("listAvailableSubjects sends the actor type value", async () => {
		respondWith({ members: [], totalCount: 0 });
		await agentVault.delegations.listAvailableSubjects(MACHINE_IDENTITY_ID, { actorType: AgentVaultMemberType.Group });
		expect(lastRequest().query.actorType).toBe("group");
	});
});

describe("agent vault retries", () => {
	// What the SDK's request timeout throws. The server may have handled the request before it fired.
	const timeoutError = () => new DOMException("This operation was aborted", "AbortError");

	it.each([
		{ name: "proxies.create", call: (av: AgentVault) => av.proxies.create({ name: "edge-proxy" }) },
		{ name: "proxies.rotateToken", call: (av: AgentVault) => av.proxies.rotateToken(PROXY_ID) },
		{ name: "sessions.create", call: (av: AgentVault) => av.sessions.create({ accessBundle: "release" }) },
		{ name: "accessBundles.create", call: (av: AgentVault) => av.accessBundles.create({ name: "release" }) }
	])("$name isn't retried once the request may have reached the server", async ({ call }) => {
		vi.useFakeTimers();
		fetchSpy.mockImplementation(async () => {
			throw timeoutError();
		});

		const assertion = expect(call(agentVault)).rejects.toThrow("This operation was aborted");
		await vi.runAllTimersAsync();
		await assertion;
		expect(fetchSpy).toHaveBeenCalledTimes(1);
	});

	it("an update is still retried after the same error", async () => {
		vi.useFakeTimers();
		fetchSpy
			.mockImplementationOnce(async () => {
				throw timeoutError();
			})
			.mockImplementationOnce(async () => new Response(JSON.stringify({ proxy: PROXY }), { status: 200 }));

		const updated = agentVault.proxies.update(PROXY_ID, { name: "edge-proxy" });
		await vi.runAllTimersAsync();
		expect(await updated).toEqual(PROXY);
		expect(fetchSpy).toHaveBeenCalledTimes(2);
	});
});
