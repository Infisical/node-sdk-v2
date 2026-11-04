// Walks through every Agent Vault method against a live Infisical instance, the way the Python SDK's
// release was verified: an admin sets up an access bundle and a delegation, then a machine identity
// starts a session on behalf of a user. The admin also starts sessions with inline services.
//
// You need, on an Infisical version with sessions on behalf of users, proxy descriptions, inline services and the
// service-hosts traffic policy:
// - ADMIN_CLIENT_ID / ADMIN_CLIENT_SECRET: universal auth for a machine identity with the Admin role in Agent Vault.
// - AGENT_CLIENT_ID / AGENT_CLIENT_SECRET / AGENT_MACHINE_IDENTITY_ID: a machine identity that's a member of
//   Agent Vault and has no delegation yet. delegations.set replaces a delegation, so the script stops if it has one.
// - USER_ID / USER_EMAIL: a user who's a member of Agent Vault directly, not only through a group.
// - SITE_URL: optional, defaults to http://localhost:8080.
//
// It only deletes what it creates: a proxy, an access bundle (with its grants) and the agent's delegation, and it
// revokes the sessions it starts.
//
// Run it with a TypeScript runner, such as: npx tsx sink/test-agent-vault.ts
import { InfisicalSDK } from "../src";
import { AgentVaultDelegationScope, AgentVaultMemberType, AgentVaultTrafficPolicy } from "../src/api/types/agent-vault";

const env = (name: string) => {
	const value = process.env[name];
	if (!value) throw new Error(`${name} must be set`);
	return value;
};

const step = async <T>(label: string, run: () => Promise<T>, check?: (value: T) => string | undefined): Promise<T> => {
	let value: T;
	try {
		value = await run();
	} catch (err) {
		throw new Error(`${label}: ${(err as Error).message}`);
	}
	const problem = check?.(value);
	if (problem) throw new Error(`${label}: ${problem}`);
	console.log(`ok  ${label}`);
	return value;
};

const expectRejection = async (label: string, run: () => Promise<unknown>, pattern: RegExp) => {
	try {
		await run();
	} catch (err) {
		if (!pattern.test((err as Error).message)) throw new Error(`${label}: unexpected error ${(err as Error).message}`);
		console.log(`ok  ${label} (${(err as Error).message})`);
		return;
	}
	throw new Error(`${label}: expected an error`);
};

(async () => {
	const siteUrl = process.env.SITE_URL || "http://localhost:8080";
	const agentId = env("AGENT_MACHINE_IDENTITY_ID");
	const userId = env("USER_ID");
	const userEmail = env("USER_EMAIL");
	const suffix = Math.random().toString(36).slice(2, 8);

	const admin = await new InfisicalSDK({ siteUrl }).auth().universalAuth.login({
		clientId: env("ADMIN_CLIENT_ID"),
		clientSecret: env("ADMIN_CLIENT_SECRET")
	});
	const agent = await new InfisicalSDK({ siteUrl }).auth().universalAuth.login({
		clientId: env("AGENT_CLIENT_ID"),
		clientSecret: env("AGENT_CLIENT_SECRET")
	});
	const adminVault = admin.agentVault();
	const agentVault = agent.agentVault();

	// What the script created and hasn't removed yet. Each one is set as soon as its request resolves, before
	// the step checks the response, so a failed check still leaves it for cleanup.
	let proxyId: string | undefined;
	let bundleId: string | undefined;
	const openSessionIds = new Set<string>();
	let delegationSet = false;

	try {
		// delegations.set replaces a delegation, so the script must not run against one someone set up.
		const existing = await adminVault.delegations.get(agentId).catch((err: Error) => {
			if (/StatusCode=404/.test(err.message)) return null;
			throw err;
		});
		if (existing) {
			throw new Error(`Machine identity ${agentId} already has a delegation, which this script would replace. Use one without a delegation.`);
		}
		console.log("ok  the agent has no delegation yet");

		console.log("\n== proxies ==");
		const created = await step(
			"proxies.create",
			async () => {
				const res = await adminVault.proxies.create({
					name: `sdk-check-${suffix}`,
					description: "Node SDK check",
					trafficPolicy: AgentVaultTrafficPolicy.ServiceHosts,
					allowedHosts: ["api.github.com", "*.slack.com"]
				});
				proxyId = res.proxy.id;
				return res;
			},
			(res) =>
				res.proxyToken &&
				res.proxy.trafficPolicy === AgentVaultTrafficPolicy.ServiceHosts &&
				res.proxy.allowedHosts === "api.github.com,*.slack.com"
					? undefined
					: `got ${JSON.stringify(res.proxy)}`
		);
		const proxy = created.proxy;
		await step("proxies.list by description", () => adminVault.proxies.list({ search: "Node SDK check" }), (res) =>
			res.proxies.some((listed) => listed.id === proxy.id) ? undefined : "proxy not listed"
		);
		await step("proxies.update removes the description and allowed hosts", () =>
			adminVault.proxies.update(proxy.id, { description: "", allowedHosts: [], pollInterval: 30 }),
			(updated) => (updated.description === null && updated.allowedHosts === null && updated.pollInterval === 30 ? undefined : `got ${JSON.stringify(updated)}`)
		);
		await step("proxies.rotateToken", () => adminVault.proxies.rotateToken(proxy.id), (res) =>
			res.proxyToken && res.proxyToken !== created.proxyToken ? undefined : "token didn't change"
		);
		await step("proxies.revoke", () => adminVault.proxies.revoke(proxy.id));
		await step(
			"proxies.delete",
			async () => {
				const deleted = await adminVault.proxies.delete(proxy.id);
				proxyId = undefined;
				return deleted;
			},
			(deleted) => (deleted.id === proxy.id ? undefined : "wrong proxy")
		);

		console.log("\n== access bundles ==");
		const bundle = await step("accessBundles.create", async () => {
			const res = await adminVault.accessBundles.create({ name: `sdk-check-${suffix}`, description: "Node SDK check" });
			bundleId = res.id;
			return res;
		});
		await step("accessBundles.get", () => adminVault.accessBundles.get(bundle.id), (res) =>
			Array.isArray(res.services) ? undefined : "no services list"
		);
		await step("accessBundles.update removes the description", () => adminVault.accessBundles.update(bundle.id, { description: "" }), (res) =>
			res.description === null ? undefined : `description is ${JSON.stringify(res.description)}`
		);
		await step("accessBundles.list", () => adminVault.accessBundles.list({ search: bundle.name }), (res) =>
			res.accessBundles.some((listed) => listed.id === bundle.id) ? undefined : "bundle not listed"
		);
		await step("accessBundles.listAvailableGrantees", () => adminVault.accessBundles.listAvailableGrantees(bundle.id));
		await step("accessBundles.grant to the agent and the user", () =>
			adminVault.accessBundles.grant(bundle.id, { machineIdentityIds: [agentId], userIds: [userId] }),
			(res) => (res.members.length + res.skipped.length === 2 ? undefined : `got ${JSON.stringify(res)}`)
		);
		await step("accessBundles.grant again skips them", () =>
			adminVault.accessBundles.grant(bundle.id, { userIds: [userId] }),
			(res) => (res.skipped.some((skipped) => skipped.id === userId) ? undefined : `got ${JSON.stringify(res)}`)
		);
		await step("accessBundles.listGrantees", () => adminVault.accessBundles.listGrantees(bundle.id), (res) =>
			res.members.some((member) => member.id === agentId) ? undefined : "agent isn't a grantee"
		);

		console.log("\n== delegations ==");
		await step("delegations.listAvailableSubjects (users)", () =>
			adminVault.delegations.listAvailableSubjects(agentId, { actorType: AgentVaultMemberType.User, search: userEmail }),
			(res) => (res.members.some((member) => member.id === userId) ? undefined : "user isn't available")
		);
		await step(
			"delegations.set",
			async () => {
				const delegation = await adminVault.delegations.set(agentId, { scope: AgentVaultDelegationScope.Selected, userIds: [userId] });
				delegationSet = true;
				return delegation;
			},
			(delegation) => (delegation.users.some((user) => user.id === userId) ? undefined : `got ${JSON.stringify(delegation)}`)
		);
		await step("delegations.get", () => adminVault.delegations.get(agentId), (delegation) =>
			Array.isArray(delegation.missingAccessBundles) ? undefined : "no missingAccessBundles"
		);
		await step("delegations.list for the agent", () => adminVault.delegations.list({ machineIdentityIds: [agentId] }), (res) =>
			res.delegations.length === 1 ? undefined : `got ${res.delegations.length} delegations`
		);
		await step("delegations.addSubjects skips a user it already names", () =>
			adminVault.delegations.addSubjects(agentId, { userIds: [userId] }),
			(delegation) => (delegation.users.length === 1 ? undefined : `got ${delegation.users.length} users`)
		);

		console.log("\n== sessions on behalf of the user ==");
		await step("accessBundles.list on behalf of the user", () => agentVault.accessBundles.list({ onBehalfOfUserEmail: userEmail }), (res) =>
			res.accessBundles.some((listed) => listed.id === bundle.id) ? undefined : "bundle not listed for the user"
		);
		await expectRejection("sessions.create with both an email and an ID", () =>
			agentVault.sessions.create({ accessBundle: bundle.name, onBehalfOfUserEmail: userEmail, onBehalfOfUserId: userId }),
			/not both/
		);
		const session = await step(
			"sessions.create on behalf of the user",
			async () => {
				const res = await agentVault.sessions.create({ accessBundle: bundle.name, onBehalfOfUserEmail: userEmail, label: "node sdk check" });
				openSessionIds.add(res.id);
				return res;
			},
			(res) => {
				const hours = (Date.parse(res.expiresAt ?? "") - Date.parse(res.createdAt)) / 3_600_000;
				return res.token && Math.abs(hours - 1) < 0.05 ? undefined : `expires in ${hours} hours`;
			}
		);
		await step("sessions.get names the user", () => agentVault.sessions.get(session.id), (res) =>
			res.onBehalfOf?.id === userId ? undefined : `onBehalfOf is ${JSON.stringify(res.onBehalfOf)}`
		);
		await step("sessions.list by the user's email", () => agentVault.sessions.list({ search: userEmail }), (res) =>
			res.sessions.some((listed) => listed.id === session.id) ? undefined : "session not listed"
		);
		await step("sessions.update removes the label", () => agentVault.sessions.update(session.id, { label: null }), (res) =>
			res.label === null ? undefined : `label is ${JSON.stringify(res.label)}`
		);
		await step(
			"sessions.revoke",
			async () => {
				const revoked = await agentVault.sessions.revoke(session.id);
				openSessionIds.delete(session.id);
				return revoked;
			},
			(res) => (res.status === "revoked" ? undefined : `status is ${res.status}`)
		);

		console.log("\n== inline services ==");
		// Unique values, so a check can tell if one of them comes back in a response.
		const token = `sdk-check-token-${suffix}`;
		const headerValue = `sdk-check-team-${suffix}`;
		const inlineService = {
			type: "http" as const,
			name: "httpbin",
			hostPattern: "httpbin.org",
			allowedMethods: ["GET" as const],
			credential: { type: "bearer" as const, value: token },
			customHeaders: [{ name: "X-Team", value: headerValue }]
		};
		const inline = await step(
			"sessions.create with only inline services, as the admin",
			async () => {
				const res = await adminVault.sessions.create({ services: [inlineService], ttl: "15m", label: "node sdk inline check" });
				openSessionIds.add(res.id);
				return res;
			},
			(res) => {
				const returned = JSON.stringify(res.services);
				if (returned.includes(token) || returned.includes(headerValue)) return "the response includes a secret";
				const [service] = res.services;
				return res.accessBundles.length === 0 && res.services.length === 1 && service.name === "httpbin" && service.credential.type === "bearer"
					? undefined
					: `got ${JSON.stringify(res)}`;
			}
		);
		await step("sessions.get returns the inline services", () => adminVault.sessions.get(inline.id), (res) =>
			res.services.length === 1 && res.services[0].hostPattern === "httpbin.org" && res.services[0].customHeaders[0]?.name === "X-Team"
				? undefined
				: `got ${JSON.stringify(res.services)}`
		);
		const withBundle = await step(
			"sessions.create with an access bundle and inline services, as the admin",
			async () => {
				const res = await adminVault.sessions.create({
					accessBundle: bundle.name,
					services: [{ ...inlineService, name: "httpbin-eu", hostPattern: "eu.httpbin.org" }],
					ttl: "15m"
				});
				openSessionIds.add(res.id);
				return res;
			},
			(res) => (res.accessBundles.length === 1 && res.services.length === 1 ? undefined : `got ${JSON.stringify(res)}`)
		);
		// The agent is a member, not an admin. If the server lets it through anyway, the session is still revoked below.
		await step(
			"sessions.create with inline services as a member is refused",
			async () => {
				try {
					const res = await agentVault.sessions.create({ services: [inlineService], ttl: "15m" });
					openSessionIds.add(res.id);
					return "the session was created";
				} catch (err) {
					return (err as Error).message;
				}
			},
			(outcome) => (/Only an Agent Vault admin can send services/.test(outcome) ? undefined : `got ${outcome}`)
		);
		for (const created of [inline, withBundle]) {
			await step(
				`sessions.revoke ${created.label ?? created.id}`,
				async () => {
					const revoked = await adminVault.sessions.revoke(created.id);
					openSessionIds.delete(created.id);
					return revoked;
				},
				(res) => (res.status === "revoked" ? undefined : `status is ${res.status}`)
			);
		}

		console.log("\n== cleanup ==");
		await step(
			"delegations.removeSubjects of the last user returns null",
			async () => {
				const delegation = await adminVault.delegations.removeSubjects(agentId, { userIds: [userId] });
				if (delegation === null) delegationSet = false;
				return delegation;
			},
			(delegation) => (delegation === null ? undefined : `got ${JSON.stringify(delegation)}`)
		);
		await step(
			"delegations.addSubjects creates a delegation",
			async () => {
				const delegation = await adminVault.delegations.addSubjects(agentId, { userIds: [userId] });
				delegationSet = true;
				return delegation;
			},
			(delegation) => (delegation.scope === AgentVaultDelegationScope.Selected ? undefined : `scope is ${delegation.scope}`)
		);
		await step("delegations.delete", async () => {
			const deleted = await adminVault.delegations.delete(agentId);
			delegationSet = false;
			return deleted;
		});
		await step("accessBundles.revoke", () => adminVault.accessBundles.revoke(bundle.id, { userIds: [userId], machineIdentityIds: [agentId] }), (res) =>
			res.members.length === 2 ? undefined : `got ${JSON.stringify(res)}`
		);
		await step("accessBundles.delete", async () => {
			const deleted = await adminVault.accessBundles.delete(bundle.id);
			bundleId = undefined;
			return deleted;
		});

		console.log("\nEvery Agent Vault flow worked.");
	} catch (err) {
		console.error(`FAIL ${(err as Error).message}`);
		process.exitCode = 1;
	} finally {
		// Remove what a failed step left behind. If a removal fails too, name what's left so it can be removed by hand.
		const leftovers: [string, () => Promise<unknown>][] = [];
		const leftBundle = bundleId;
		const leftProxy = proxyId;
		// The admin can revoke every session, including the agent's.
		for (const id of openSessionIds) leftovers.push([`revoke session ${id}`, () => adminVault.sessions.revoke(id)]);
		if (delegationSet) leftovers.push([`delete the delegation of machine identity ${agentId}`, () => adminVault.delegations.delete(agentId)]);
		if (leftBundle) leftovers.push([`delete access bundle ${leftBundle}`, () => adminVault.accessBundles.delete(leftBundle)]);
		if (leftProxy) leftovers.push([`delete proxy ${leftProxy}`, () => adminVault.proxies.delete(leftProxy)]);

		for (const [action, run] of leftovers) {
			try {
				await run();
				console.log(`ok  cleanup: ${action}`);
			} catch (err) {
				console.error(`FAIL cleanup: couldn't ${action}, so do it by hand: ${(err as Error).message}`);
				process.exitCode = 1;
			}
		}
	}
})().catch((err) => {
	console.error(`FAIL ${err.message}`);
	process.exitCode = 1;
});
