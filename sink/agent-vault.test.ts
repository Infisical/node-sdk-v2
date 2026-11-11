import { inspect } from "node:util";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { AgentVaultInlineServiceInput, InfisicalSDK, InfisicalSDKError, InfisicalSDKRequestError } from "../src";
import { FetchHttpError } from "../src/api/fetch-errors";
import {
	AgentVaultDelegationScope,
	AgentVaultMemberType,
	AgentVaultSessionScope,
	AgentVaultSessionStatus,
	AgentVaultTrafficPolicy
} from "../src/api/types/agent-vault";

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
const PROJECT_ID = "4d6f8a0c-2e4b-4c6d-8f0a-1b3d5f7a9c2e";
const PROJECT = { projectId: PROJECT_ID };

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
const SESSION_ACCESS_BUNDLE = { id: BUNDLE_ID, name: "release" };
const SESSION = {
	id: SESSION_ID,
	label: null,
	actor: { type: "machineIdentity", id: MACHINE_IDENTITY_ID, name: "slack-bot" },
	onBehalfOf: { type: "user", ...USER },
	status: "active",
	expiresAt: "2026-10-27T01:00:00.000Z",
	revokedAt: null,
	createdAt: CREATED_AT,
	accessBundle: SESSION_ACCESS_BUNDLE,
	services: []
};
const CREATED_SESSION = {
	id: SESSION_ID,
	projectId: PROJECT_ID,
	label: null,
	token: "session-token",
	expiresAt: SESSION.expiresAt,
	createdAt: CREATED_AT,
	accessBundle: SESSION_ACCESS_BUNDLE,
	services: []
};
// A service sent with a session, as the SDK takes it and as the API returns it (without its secrets).
const INLINE_SERVICE_INPUT = {
	type: "http" as const,
	name: "github",
	hostPattern: "api.github.com",
	allowedMethods: ["GET" as const],
	credential: { type: "bearer" as const, value: "github-token" },
	customHeaders: [{ name: "X-Team", value: "platform" }]
};
const INLINE_SERVICE = {
	id: "8e2f4a6c-1b3d-4e5f-9a7b-2c4d6e8f0a1b",
	name: "github",
	type: "http",
	hostPattern: "api.github.com",
	allowedMethods: ["GET"],
	allowedPathPrefixes: null,
	credential: { type: "bearer", headerName: "Authorization", headerPrefix: "Bearer" },
	customHeaders: [{ name: "X-Team", prefix: "" }],
	substitutions: []
};
const BUNDLE = { id: BUNDLE_ID, name: "release", description: null, createdAt: CREATED_AT, updatedAt: CREATED_AT };
const SERVICE = {
	id: SERVICE_ID,
	name: "github",
	type: "http",
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

const respondWith = (payload: unknown, status = 200) => {
	fetchSpy.mockImplementation(async () => new Response(JSON.stringify(payload), { status }));
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
		call: (av) => av.proxies.list(PROJECT),
		method: "GET",
		path: "/proxies",
		query: { projectId: PROJECT_ID, orderBy: "createdAt", orderDirection: "desc", limit: "20", offset: "0" },
		response: { proxies: [PROXY], totalCount: 1 },
		returns: (res) => res
	},
	{
		name: "proxies.create",
		call: (av) => av.proxies.create({ ...PROJECT, name: "edge-proxy" }),
		method: "POST",
		path: "/proxies",
		body: { projectId: PROJECT_ID, name: "edge-proxy", trafficPolicy: "any-host", pollInterval: 60 },
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
		call: (av) => av.sessions.list(PROJECT),
		method: "GET",
		path: "/sessions",
		query: { projectId: PROJECT_ID, scope: "mine", limit: "20", offset: "0" },
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
		call: (av) => av.sessions.create({ ...PROJECT, accessBundle: "release" }),
		method: "POST",
		path: "/sessions",
		body: { projectId: PROJECT_ID, accessBundle: "release" },
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
		response: { session: { ...SESSION, accessBundle: undefined, services: undefined, status: "revoked", revokedAt: CREATED_AT } },
		returns: (res) => res.session
	},
	{
		name: "accessBundles.list",
		call: (av) => av.accessBundles.list(PROJECT),
		method: "GET",
		path: "/access-bundles",
		query: { projectId: PROJECT_ID, orderBy: "createdAt", orderDirection: "desc", limit: "20", offset: "0" },
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
		call: (av) => av.accessBundles.create({ ...PROJECT, name: "release" }),
		method: "POST",
		path: "/access-bundles",
		body: { projectId: PROJECT_ID, name: "release" },
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
		call: (av) => av.delegations.list(PROJECT),
		method: "GET",
		path: "/delegations",
		query: { projectId: PROJECT_ID, limit: "100", offset: "0" },
		response: { delegations: [DELEGATION], totalCount: 1 },
		returns: (res) => res
	},
	{
		name: "delegations.get",
		call: (av) => av.delegations.get(MACHINE_IDENTITY_ID, PROJECT),
		method: "GET",
		path: `/delegations/${MACHINE_IDENTITY_ID}`,
		query: { projectId: PROJECT_ID },
		response: { delegation: DELEGATION_DETAIL },
		returns: (res) => res.delegation
	},
	{
		name: "delegations.set",
		call: (av) => av.delegations.set(MACHINE_IDENTITY_ID, { ...PROJECT, scope: AgentVaultDelegationScope.AllMembers }),
		method: "PUT",
		path: `/delegations/${MACHINE_IDENTITY_ID}`,
		query: { projectId: PROJECT_ID },
		body: { scope: "all-members" },
		response: { delegation: { ...DELEGATION_DETAIL, scope: "all-members", users: [], groups: [] } },
		returns: (res) => res.delegation
	},
	{
		name: "delegations.delete",
		call: (av) => av.delegations.delete(MACHINE_IDENTITY_ID, PROJECT),
		method: "DELETE",
		path: `/delegations/${MACHINE_IDENTITY_ID}`,
		query: { projectId: PROJECT_ID },
		response: { delegation: DELEGATION },
		returns: (res) => res.delegation
	},
	{
		name: "delegations.addSubjects",
		call: (av) => av.delegations.addSubjects(MACHINE_IDENTITY_ID, { ...PROJECT, userIds: [USER_ID] }),
		method: "POST",
		path: `/delegations/${MACHINE_IDENTITY_ID}/subjects`,
		query: { projectId: PROJECT_ID },
		body: { userIds: [USER_ID] },
		response: { delegation: DELEGATION_DETAIL },
		returns: (res) => res.delegation
	},
	{
		name: "delegations.removeSubjects",
		call: (av) => av.delegations.removeSubjects(MACHINE_IDENTITY_ID, { ...PROJECT, groupIds: [GROUP_ID] }),
		method: "DELETE",
		path: `/delegations/${MACHINE_IDENTITY_ID}/subjects`,
		query: { projectId: PROJECT_ID },
		body: { groupIds: [GROUP_ID] },
		response: { delegation: { ...DELEGATION_DETAIL, groups: [] } },
		returns: (res) => res.delegation
	},
	{
		name: "delegations.listAvailableSubjects",
		call: (av) => av.delegations.listAvailableSubjects(MACHINE_IDENTITY_ID, PROJECT),
		method: "GET",
		path: `/delegations/${MACHINE_IDENTITY_ID}/subjects/available`,
		query: { projectId: PROJECT_ID, limit: "20", offset: "0" },
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

describe("agent vault project", () => {
	const project = PROJECT;

	it.each([
		{ name: "proxies.list", call: (av: AgentVault) => av.proxies.list(project), response: { proxies: [], totalCount: 0 } },
		{ name: "sessions.list", call: (av: AgentVault) => av.sessions.list(project), response: { sessions: [], totalCount: 0 } },
		{
			name: "accessBundles.list",
			call: (av: AgentVault) => av.accessBundles.list(project),
			response: { accessBundles: [], totalCount: 0 }
		},
		{
			name: "delegations.list",
			call: (av: AgentVault) => av.delegations.list(project),
			response: { delegations: [], totalCount: 0 }
		},
		{
			name: "delegations.get",
			call: (av: AgentVault) => av.delegations.get(MACHINE_IDENTITY_ID, project),
			response: { delegation: DELEGATION_DETAIL }
		},
		{
			name: "delegations.set",
			call: (av: AgentVault) => av.delegations.set(MACHINE_IDENTITY_ID, { ...project, scope: "all-members" }),
			response: { delegation: DELEGATION_DETAIL },
			body: { scope: "all-members" }
		},
		{
			name: "delegations.delete",
			call: (av: AgentVault) => av.delegations.delete(MACHINE_IDENTITY_ID, project),
			response: { delegation: DELEGATION }
		},
		{
			name: "delegations.addSubjects",
			call: (av: AgentVault) => av.delegations.addSubjects(MACHINE_IDENTITY_ID, { ...project, userIds: [USER_ID] }),
			response: { delegation: DELEGATION_DETAIL },
			body: { userIds: [USER_ID] }
		},
		{
			name: "delegations.removeSubjects",
			call: (av: AgentVault) => av.delegations.removeSubjects(MACHINE_IDENTITY_ID, { ...project, userIds: [USER_ID] }),
			response: { delegation: DELEGATION_DETAIL },
			body: { userIds: [USER_ID] }
		},
		{
			name: "delegations.listAvailableSubjects",
			call: (av: AgentVault) => av.delegations.listAvailableSubjects(MACHINE_IDENTITY_ID, project),
			response: { members: [], totalCount: 0 }
		}
	])("$name sends projectId in the query string", async ({ call, response, body }) => {
		respondWith(response);
		await call(agentVault);
		const request = lastRequest();
		expect(request.query.projectId).toBe(PROJECT_ID);
		expect(request.body).toEqual(body);
	});

	it.each([
		{
			name: "proxies.create",
			call: (av: AgentVault) => av.proxies.create({ ...project, name: "edge-proxy" }),
			response: { proxy: PROXY, proxyToken: "proxy-token" }
		},
		{
			name: "sessions.create",
			call: (av: AgentVault) => av.sessions.create({ ...project, accessBundle: "release" }),
			response: { session: CREATED_SESSION }
		},
		{
			name: "accessBundles.create",
			call: (av: AgentVault) => av.accessBundles.create({ ...project, name: "release" }),
			response: { accessBundle: BUNDLE }
		}
	])("$name sends projectId in the body", async ({ call, response }) => {
		respondWith(response);
		await call(agentVault);
		const request = lastRequest();
		expect(request.body.projectId).toBe(PROJECT_ID);
		expect(request.query).toEqual({});
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
		const created = await agentVault.proxies.create({ ...PROJECT, name: "edge-proxy", description: "Edge traffic" });
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
		await agentVault.proxies.create({ ...PROJECT, name: "edge-proxy", allowedHosts });
		expect(lastRequest().body).not.toHaveProperty("allowedHosts");
	});

	it("create joins a list of allowed hosts into the comma-separated string the API takes", async () => {
		respondWith({ proxy: PROXY, proxyToken: "proxy-token" });
		await agentVault.proxies.create({
			...PROJECT,
			name: "edge-proxy",
			trafficPolicy: AgentVaultTrafficPolicy.ServiceHosts,
			allowedHosts: ["api.github.com", "*.slack.com"]
		});
		expect(lastRequest().body).toMatchObject({ allowedHosts: "api.github.com,*.slack.com" });
	});
});

describe("agent vault traffic policy", () => {
	// service-hosts is the new name of bundle-hosts. Infisical still accepts bundle-hosts and stores it, and a version
	// from before the rename accepts only bundle-hosts, so the SDK sends service-hosts as bundle-hosts.
	const hostsOnly = [AgentVaultTrafficPolicy.ServiceHosts, "service-hosts" as const];

	it.each(hostsOnly)("create sends %s as bundle-hosts, which every Infisical version accepts", async (trafficPolicy) => {
		respondWith({ proxy: PROXY, proxyToken: "proxy-token" });
		await agentVault.proxies.create({ ...PROJECT, name: "edge-proxy", trafficPolicy });
		expect(lastRequest().body.trafficPolicy).toBe("bundle-hosts");
	});

	it.each(hostsOnly)("update sends %s as bundle-hosts, which every Infisical version accepts", async (trafficPolicy) => {
		respondWith({ proxy: PROXY });
		await agentVault.proxies.update(PROXY_ID, { trafficPolicy });
		expect(lastRequest().body).toEqual({ trafficPolicy: "bundle-hosts" });
	});

	it("sends any-host as it is", async () => {
		respondWith({ proxy: PROXY, proxyToken: "proxy-token" });
		await agentVault.proxies.create({ ...PROJECT, name: "edge-proxy", trafficPolicy: AgentVaultTrafficPolicy.AnyHost });
		expect(lastRequest().body.trafficPolicy).toBe("any-host");
		await agentVault.proxies.update(PROXY_ID, { trafficPolicy: "any-host" });
		expect(lastRequest().body).toEqual({ trafficPolicy: "any-host" });
	});

	// Infisical with service-hosts returns it, and a version from before the rename returns bundle-hosts.
	it.each(["service-hosts", "bundle-hosts"])("reports %s from every proxy response as service-hosts", async (returned) => {
		const proxy = { ...PROXY, trafficPolicy: returned };
		const reported: unknown[] = [];

		respondWith({ proxies: [proxy], totalCount: 1 });
		reported.push((await agentVault.proxies.list(PROJECT)).proxies[0].trafficPolicy);
		respondWith({ proxy, proxyToken: "proxy-token" });
		reported.push((await agentVault.proxies.create({ ...PROJECT, name: "edge-proxy" })).proxy.trafficPolicy);
		respondWith({ proxy });
		reported.push((await agentVault.proxies.update(PROXY_ID, { pollInterval: 30 })).trafficPolicy);
		respondWith({ proxy, proxyToken: "proxy-token" });
		reported.push((await agentVault.proxies.rotateToken(PROXY_ID)).proxy.trafficPolicy);
		respondWith({ proxy });
		reported.push((await agentVault.proxies.revoke(PROXY_ID)).trafficPolicy);

		expect(reported).toEqual(Array(5).fill("service-hosts"));
	});

	it("leaves any-host, and a member's proxy without settings, as they are", async () => {
		const { trafficPolicy, allowedHosts, pollInterval, createdAt, ...memberView } = PROXY;
		respondWith({ proxies: [PROXY, memberView], totalCount: 2 });
		const { proxies } = await agentVault.proxies.list(PROJECT);
		expect(proxies).toEqual([PROXY, memberView]);
	});
});

describe("agent vault typed services", () => {
	const { hostPattern, allowedMethods, allowedPathPrefixes, ...SERVICE_BASE } = SERVICE;
	const POSTGRES_SERVICE = {
		...SERVICE_BASE,
		name: "orders-db",
		type: "postgres",
		host: "db.internal",
		port: 5432,
		database: "orders",
		tls: { enabled: true, verify: true, ca: null },
		credential: { type: "basic", memberProvidedFields: [] }
	};
	const SSH_SERVICE = {
		...SERVICE_BASE,
		id: "7d1e3f5a-9b2c-4d6e-8f0a-1b3c5d7e9f2a",
		name: "bastion",
		type: "ssh",
		host: "bastion.internal",
		port: 22,
		credential: { type: "ssh-key", hasCertificate: false }
	};
	it("access bundle get reads a database and an SSH service by type", async () => {
		respondWith({ accessBundle: { ...BUNDLE, services: [POSTGRES_SERVICE, SSH_SERVICE] } });
		const { services } = await agentVault.accessBundles.get(BUNDLE_ID);
		expect(services).toEqual([POSTGRES_SERVICE, SSH_SERVICE]);
		const [database, server] = services;
		if (database.type !== "postgres" || server.type !== "ssh") throw new Error("services were not narrowed");
		expect(database.tls).toEqual({ enabled: true, verify: true, ca: null });
		expect([database.host, database.port, database.database]).toEqual(["db.internal", 5432, "orders"]);
		expect([server.host, server.port]).toEqual(["bastion.internal", 22]);
	});

	it("sessions read an inline database service by type", async () => {
		const inline = {
			id: INLINE_SERVICE.id,
			name: "orders-db",
			description: "Orders replica",
			type: "mysql",
			host: "db.internal",
			port: 3306,
			database: "orders",
			tls: { enabled: false, verify: false, ca: null },
			credential: { type: "basic" }
		};
		respondWith({ session: { ...SESSION, services: [inline] } });
		const [service] = (await agentVault.sessions.get(SESSION_ID)).services;
		expect(service).toEqual(inline);
		if (service.type !== "mysql") throw new Error("service was not narrowed");
		expect(service.database).toBe("orders");
		expect(service.description).toBe("Orders replica");
	});
});

describe("agent vault inline services", () => {
	it("create sends services without an access bundle", async () => {
		respondWith({ session: { ...CREATED_SESSION, accessBundle: null, services: [INLINE_SERVICE] } });
		const created = await agentVault.sessions.create({ ...PROJECT, services: [INLINE_SERVICE_INPUT], ttl: "15m" });
		expect(lastRequest().body).toEqual({ projectId: PROJECT_ID, services: [INLINE_SERVICE_INPUT], ttl: "15m" });
		expect(created.services).toEqual([INLINE_SERVICE]);
		expect(created.accessBundle).toBeNull();
	});

	it("create sends database and SSH services", async () => {
		const services: AgentVaultInlineServiceInput[] = [
			{
				type: "postgres",
				name: "orders-db",
				description: "Orders replica",
				host: "db.internal",
				database: "orders",
				tls: { verify: false },
				credential: { type: "basic", username: "agent", password: "db-password" }
			},
			{
				type: "ssh",
				name: "bastion",
				host: "bastion.internal",
				credential: { type: "ssh-key", username: "deploy", privateKey: "ssh-private-key" }
			}
		];
		respondWith({ session: { ...CREATED_SESSION, accessBundle: null } });
		await agentVault.sessions.create({ ...PROJECT, services });
		expect(lastRequest().body).toEqual({ projectId: PROJECT_ID, services });
	});

	it("create sends an access bundle and services together", async () => {
		respondWith({ session: { ...CREATED_SESSION, services: [INLINE_SERVICE] } });
		await agentVault.sessions.create({ ...PROJECT, accessBundle: "release", services: [INLINE_SERVICE_INPUT] });
		expect(lastRequest().body).toEqual({ projectId: PROJECT_ID, accessBundle: "release", services: [INLINE_SERVICE_INPUT] });
	});

	it("create sends an empty access bundle name, so the server rejects it instead of dropping it", async () => {
		respondWith({ session: CREATED_SESSION });
		await agentVault.sessions.create({ ...PROJECT, accessBundle: "" });
		expect(lastRequest().body).toEqual({ projectId: PROJECT_ID, accessBundle: "" });
	});

	it("returns a session's services as the API sends them", async () => {
		respondWith({ session: { ...SESSION, services: [INLINE_SERVICE] } });
		expect((await agentVault.sessions.get(SESSION_ID)).services).toEqual([INLINE_SERVICE]);
	});

	// Infisical's validation errors list their issues in message, as an array rather than a string.
	it("keeps the server's explanation when it refuses a request with 422", async () => {
		respondWith(
			{
				reqId: "req-1",
				statusCode: 422,
				message: [
					{
						code: "too_big",
						maximum: 20,
						path: ["services"],
						message: "A session can have at most 20 services. Add the others to an access bundle and name it in accessBundles."
					}
				],
				error: "ValidationFailure"
			},
			422
		);
		await expect(agentVault.sessions.create({ ...PROJECT, services: [INLINE_SERVICE_INPUT] })).rejects.toThrow(
			/\[StatusCode=422\].*at most 20 services/
		);
	});

	it("uses the server's message for a refusal that isn't a validation error", async () => {
		respondWith(
			{
				statusCode: 403,
				message: "Only an Agent Vault admin can send services with a session. Name an access bundle instead.",
				error: "PermissionDenied"
			},
			403
		);
		await expect(agentVault.sessions.create({ ...PROJECT, services: [INLINE_SERVICE_INPUT] })).rejects.toThrow(
			/\[StatusCode=403\] Only an Agent Vault admin can send services with a session/
		);
	});

	// An Infisical version without inline services leaves services out of every session.
	it("gives sessions from an Infisical version without inline services an empty list of them", async () => {
		const { services, ...olderSession } = SESSION;
		const { services: createdServices, ...olderCreated } = CREATED_SESSION;

		respondWith({ sessions: [olderSession], totalCount: 1 });
		expect((await agentVault.sessions.list(PROJECT)).sessions[0].services).toEqual([]);
		respondWith({ session: olderSession });
		expect((await agentVault.sessions.get(SESSION_ID)).services).toEqual([]);
		respondWith({ session: olderSession });
		expect((await agentVault.sessions.update(SESSION_ID, { label: null })).services).toEqual([]);
		respondWith({ session: olderCreated });
		expect((await agentVault.sessions.create({ ...PROJECT, accessBundle: "release" })).services).toEqual([]);
	});
});

describe("agent vault sessions", () => {
	it("get reads the one access bundle a session carries, which keeps its name once deleted", async () => {
		respondWith({ session: SESSION });
		expect((await agentVault.sessions.get(SESSION_ID)).accessBundle).toEqual({ id: BUNDLE_ID, name: "release" });

		respondWith({ session: { ...SESSION, accessBundle: { id: null, name: "release" } } });
		expect((await agentVault.sessions.get(SESSION_ID)).accessBundle).toEqual({ id: null, name: "release" });
	});

	it("create sends one access bundle and reads it back", async () => {
		respondWith({ session: CREATED_SESSION });
		const created = await agentVault.sessions.create({ ...PROJECT, accessBundle: "release", ttl: "1h" });
		expect(lastRequest().body).toEqual({ projectId: PROJECT_ID, accessBundle: "release", ttl: "1h" });
		expect(created.accessBundle).toEqual({ id: BUNDLE_ID, name: "release" });
	});

	it("create reads the project the session belongs to", async () => {
		respondWith({ session: CREATED_SESSION });
		const created = await agentVault.sessions.create({ ...PROJECT, accessBundle: "release" });
		expect(created.projectId).toBe(PROJECT_ID);
	});

	it.each(["nightly deploy", null])("update always sends the label (%j)", async (label) => {
		respondWith({ session: { ...SESSION, label } });
		const updated = await agentVault.sessions.update(SESSION_ID, { label });
		expect(lastRequest().body).toEqual({ label });
		expect(updated.label).toBe(label);
	});

	it("create leaves out ttl so the server picks the default", async () => {
		respondWith({ session: CREATED_SESSION });
		await agentVault.sessions.create({ ...PROJECT, accessBundle: "release" });
		expect(lastRequest().body).toEqual({ projectId: PROJECT_ID, accessBundle: "release" });
	});

	it.each([
		{ name: "email", options: { onBehalfOfUserEmail: USER_EMAIL }, onBehalfOf: { userEmail: USER_EMAIL } },
		{ name: "ID", options: { onBehalfOfUserId: USER_ID }, onBehalfOf: { userId: USER_ID } },
		{ name: "empty email", options: { onBehalfOfUserEmail: "" }, onBehalfOf: { userEmail: "" } }
	])("create names the user it acts for by $name", async ({ options, onBehalfOf }) => {
		respondWith({ session: CREATED_SESSION });
		await agentVault.sessions.create({ ...PROJECT, accessBundle: "release", ...options });
		expect(lastRequest().body).toEqual({ projectId: PROJECT_ID, accessBundle: "release", onBehalfOf });
	});

	it("create rejects both a user email and a user ID before sending a request", async () => {
		const created = agentVault.sessions.create({
			...PROJECT,
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
			...PROJECT,
			scope: AgentVaultSessionScope.All,
			statuses: [AgentVaultSessionStatus.Active, "expired"]
		});
		expect(lastRequest().query).toMatchObject({ scope: "all", status: "active,expired" });
	});
});

describe("agent vault access bundles", () => {
	it("list sends booleans the way the API reads them", async () => {
		respondWith({ accessBundles: [], totalCount: 0 });
		await agentVault.accessBundles.list({ ...PROJECT, requiresSetup: true, granted: false });
		expect(lastRequest().query).toMatchObject({ requiresSetup: "true", granted: "false" });
	});

	it("list names the user a session would act for", async () => {
		respondWith({ accessBundles: [], totalCount: 0 });
		await agentVault.accessBundles.list({ ...PROJECT, onBehalfOfUserEmail: USER_EMAIL });
		const { query } = lastRequest();
		expect(query.onBehalfOfUserEmail).toBe(USER_EMAIL);
		expect(query).not.toHaveProperty("onBehalfOfUserId");
	});

	it("list rejects both a user email and a user ID before sending a request", async () => {
		const listed = agentVault.accessBundles.list({ ...PROJECT, onBehalfOfUserEmail: USER_EMAIL, onBehalfOfUserId: USER_ID });
		await expect(listed).rejects.toThrow("not both");
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it("update sends an empty description to remove it", async () => {
		respondWith({ accessBundle: BUNDLE });
		await agentVault.accessBundles.update(BUNDLE_ID, { description: "" });
		expect(lastRequest().body).toEqual({ description: "" });
	});

	it("listGrantees and listAvailableGrantees send the actor type value", async () => {
		respondWith({ members: [], totalCount: 0 });
		await agentVault.accessBundles.listGrantees(BUNDLE_ID, { actorType: AgentVaultMemberType.Group });
		expect(lastRequest().query.actorType).toBe("group");
		await agentVault.accessBundles.listAvailableGrantees(BUNDLE_ID, { actorType: "machineIdentity" });
		expect(lastRequest().query.actorType).toBe("machineIdentity");
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
			...PROJECT,
			scope: AgentVaultDelegationScope.Selected,
			groupIds: [GROUP_ID]
		});
		expect(lastRequest()).toMatchObject({ method: "PUT", body: { scope: "selected", groupIds: [GROUP_ID] } });
	});

	it("list joins the machine identity IDs", async () => {
		respondWith({ delegations: [DELEGATION], totalCount: 1 });
		await agentVault.delegations.list({ ...PROJECT, machineIdentityIds: [MACHINE_IDENTITY_ID, OTHER_MACHINE_IDENTITY_ID] });
		expect(lastRequest().query.machineIdentityIds).toBe(`${MACHINE_IDENTITY_ID},${OTHER_MACHINE_IDENTITY_ID}`);
	});

	it("removeSubjects returns null once the last one is gone", async () => {
		respondWith({ delegation: null });
		const delegation = await agentVault.delegations.removeSubjects(MACHINE_IDENTITY_ID, { ...PROJECT, userIds: [USER_ID] });
		expect(delegation).toBeNull();
		expect(lastRequest().body).toEqual({ userIds: [USER_ID] });
	});

	it("listAvailableSubjects sends the actor type value", async () => {
		respondWith({ members: [], totalCount: 0 });
		await agentVault.delegations.listAvailableSubjects(MACHINE_IDENTITY_ID, { ...PROJECT, actorType: AgentVaultMemberType.Group });
		expect(lastRequest().query.actorType).toBe("group");
	});
});

describe("agent vault retries", () => {
	// What the SDK's request timeout throws. The server may have handled the request before it fired.
	const timeoutError = () => new DOMException("The request timed out after 10 seconds", "TimeoutError");

	it.each([
		{ name: "proxies.create", call: (av: AgentVault) => av.proxies.create({ ...PROJECT, name: "edge-proxy" }) },
		{ name: "proxies.rotateToken", call: (av: AgentVault) => av.proxies.rotateToken(PROXY_ID) },
		{ name: "sessions.create", call: (av: AgentVault) => av.sessions.create({ ...PROJECT, accessBundle: "release" }) },
		{ name: "accessBundles.create", call: (av: AgentVault) => av.accessBundles.create({ ...PROJECT, name: "release" }) },
		// A retry after a lost response would report every grantee as skipped.
		{ name: "accessBundles.grant", call: (av: AgentVault) => av.accessBundles.grant(BUNDLE_ID, { userIds: [USER_ID] }) },
		{ name: "accessBundles.revoke", call: (av: AgentVault) => av.accessBundles.revoke(BUNDLE_ID, { userIds: [USER_ID] }) },
		// A retry after a lost response would fail with a 404 for a delete that worked.
		{ name: "proxies.delete", call: (av: AgentVault) => av.proxies.delete(PROXY_ID) },
		{ name: "accessBundles.delete", call: (av: AgentVault) => av.accessBundles.delete(BUNDLE_ID) },
		{ name: "delegations.delete", call: (av: AgentVault) => av.delegations.delete(MACHINE_IDENTITY_ID, PROJECT) },
		{
			name: "delegations.removeSubjects",
			call: (av: AgentVault) => av.delegations.removeSubjects(MACHINE_IDENTITY_ID, { ...PROJECT, userIds: [USER_ID] })
		}
	])("$name isn't retried once the request may have reached the server", async ({ call }) => {
		vi.useFakeTimers();
		fetchSpy.mockImplementation(async () => {
			throw timeoutError();
		});

		const assertion = expect(call(agentVault)).rejects.toThrow("The request timed out after 10 seconds");
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

describe("agent vault IDs", () => {
	// fetch resolves "." and ".." like directories, so revoke("..") would reach the route that removes members from
	// Agent Vault, which takes the same body.
	it.each(["", ".", ".."])("refuses the ID %j before sending a request", async (id) => {
		await expect(agentVault.accessBundles.revoke(id, { userIds: [USER_ID] })).rejects.toThrow(InfisicalSDKError);
		await expect(agentVault.sessions.get(id)).rejects.toThrow(/^Invalid ID/);
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it("sends an ID that is a dot segment only once decoded, encoded so it stays one segment", async () => {
		respondWith({ session: SESSION });
		await agentVault.sessions.get("%2e%2e");
		expect(lastRequest().path).toBe("/api/v1/agent-vault/sessions/%252e%252e");
	});
});

describe("agent vault errors", () => {
	it("throws an InfisicalSDKRequestError, exported from the package root, with the status code", async () => {
		respondWith({ statusCode: 404, message: "This machine identity has no delegation", error: "NotFound" }, 404);
		const error = await agentVault.delegations.get(MACHINE_IDENTITY_ID, PROJECT).catch((err: unknown) => err);
		expect(error).toBeInstanceOf(InfisicalSDKRequestError);
		expect((error as InfisicalSDKRequestError).statusCode).toBe(404);
		expect((error as Error).message).toMatch(/\[StatusCode=404\] This machine identity has no delegation$/);
		expect((error as Error).cause).toBeDefined();
	});

	it("says a request timed out, and after how long, with the timeout in cause", async () => {
		vi.useFakeTimers();
		fetchSpy.mockImplementation(
			(_url: string, init: RequestInit) =>
				new Promise((_resolve, reject) => init.signal!.addEventListener("abort", () => reject(init.signal!.reason)))
		);

		const error = agentVault.sessions.create({ ...PROJECT, accessBundle: "release" }).catch((err: unknown) => err);
		await vi.advanceTimersByTimeAsync(10_000);
		const thrown = (await error) as InfisicalSDKError;

		expect(thrown).toBeInstanceOf(InfisicalSDKError);
		expect(thrown.message).toBe("The request timed out after 10 seconds");
		expect((thrown.cause as DOMException).name).toBe("TimeoutError");
		expect(fetchSpy).toHaveBeenCalledTimes(1);
	});

	it("keeps the network error in cause, so a reset connection can be told apart from a timeout", async () => {
		const reset = new TypeError("fetch failed", { cause: Object.assign(new Error("ECONNRESET"), { code: "ECONNRESET" }) });
		fetchSpy.mockRejectedValue(reset);

		const thrown = (await agentVault.sessions.create({ ...PROJECT, accessBundle: "release" }).catch((err: unknown) => err)) as Error;

		expect(thrown).toBeInstanceOf(InfisicalSDKError);
		expect(thrown.message).toBe("fetch failed");
		expect(thrown.cause).toBe(reset);
	});

	it("keeps a large response body out of the printed error, but readable in cause.response.data", async () => {
		const page = `<html><body>${"<p>Bad gateway</p>".repeat(8500)}</body></html>`;
		fetchSpy.mockImplementation(async () => new Response(page, { status: 502, headers: { "Content-Type": "text/html" } }));

		const error = (await agentVault.sessions.get(SESSION_ID).catch((err: unknown) => err)) as InfisicalSDKError;

		expect(error).toBeInstanceOf(InfisicalSDKError);
		expect(error.message).toBe("Request failed with status 502");
		expect(inspect(error)).not.toContain("Bad gateway");
		expect(Object.keys(error.cause as object)).not.toContain("response");
		expect((error.cause as FetchHttpError).response.data).toBe(page);
		expect((error.cause as FetchHttpError).response.status).toBe(502);
	});

	it("throws an error the SDK raised itself as it is, without wrapping it", async () => {
		const error = await agentVault.accessBundles
			.list({ ...PROJECT, onBehalfOfUserEmail: USER_EMAIL, onBehalfOfUserId: USER_ID })
			.catch((err: unknown) => err);
		expect(error).toBeInstanceOf(InfisicalSDKError);
		expect((error as Error).cause).toBeUndefined();
	});
});
