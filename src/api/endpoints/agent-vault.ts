import { ApiClient } from "../base";
import {
	AgentVaultProxyWithTokenResponse,
	ChangeAgentVaultAccessBundleGrantsRequest,
	ChangeAgentVaultDelegationSubjectsRequest,
	CreateAgentVaultAccessBundleRequest,
	CreateAgentVaultProxyRequest,
	CreateAgentVaultSessionRequest,
	CreateAgentVaultSessionResponse,
	DeleteAgentVaultDelegationResponse,
	DeleteAgentVaultProxyResponse,
	GetAgentVaultAccessBundleResponse,
	GrantAgentVaultAccessBundleResponse,
	ListAgentVaultAccessBundleMembersRequest,
	ListAgentVaultAccessBundlesRequest,
	ListAgentVaultAccessBundlesResponse,
	ListAgentVaultDelegationsRequest,
	ListAgentVaultDelegationsResponse,
	ListAgentVaultGranteesResponse,
	ListAgentVaultMembersResponse,
	ListAgentVaultProxiesRequest,
	ListAgentVaultProxiesResponse,
	ListAgentVaultSessionsRequest,
	ListAgentVaultSessionsResponse,
	ListAvailableAgentVaultDelegationSubjectsRequest,
	RemoveAgentVaultDelegationSubjectsResponse,
	RevokeAgentVaultAccessBundleResponse,
	RevokeAgentVaultSessionResponse,
	SetAgentVaultDelegationRequest,
	SingleAgentVaultAccessBundleResponse,
	SingleAgentVaultDelegationResponse,
	SingleAgentVaultProxyResponse,
	SingleAgentVaultSessionResponse,
	UpdateAgentVaultAccessBundleRequest,
	UpdateAgentVaultProxyRequest,
	UpdateAgentVaultSessionRequest
} from "../types/agent-vault";

const BASE_PATH = "/api/v1/agent-vault";

const segment = (id: string) => encodeURIComponent(id);

// Creates and token rotations use postOnce, so a network error after the request may have reached the server
// isn't retried: a retry could create a second proxy, session or access bundle, or rotate a token twice.
export class AgentVaultApi {
	constructor(private apiClient: ApiClient) {}

	proxies = {
		list: (params: ListAgentVaultProxiesRequest) =>
			this.apiClient.get<ListAgentVaultProxiesResponse>(`${BASE_PATH}/proxies`, { params }),

		create: (data: CreateAgentVaultProxyRequest) =>
			this.apiClient.postOnce<AgentVaultProxyWithTokenResponse>(`${BASE_PATH}/proxies`, data),

		update: (proxyId: string, data: UpdateAgentVaultProxyRequest) =>
			this.apiClient.patch<SingleAgentVaultProxyResponse>(`${BASE_PATH}/proxies/${segment(proxyId)}`, data),

		delete: (proxyId: string) =>
			this.apiClient.delete<DeleteAgentVaultProxyResponse>(`${BASE_PATH}/proxies/${segment(proxyId)}`),

		rotateToken: (proxyId: string) =>
			this.apiClient.postOnce<AgentVaultProxyWithTokenResponse>(
				`${BASE_PATH}/proxies/${segment(proxyId)}/token-auth/proxy-token`
			),

		revoke: (proxyId: string) =>
			this.apiClient.post<SingleAgentVaultProxyResponse>(`${BASE_PATH}/proxies/${segment(proxyId)}/revoke`)
	};

	sessions = {
		list: (params: ListAgentVaultSessionsRequest) =>
			this.apiClient.get<ListAgentVaultSessionsResponse>(`${BASE_PATH}/sessions`, { params }),

		get: (sessionId: string) =>
			this.apiClient.get<SingleAgentVaultSessionResponse>(`${BASE_PATH}/sessions/${segment(sessionId)}`),

		create: (data: CreateAgentVaultSessionRequest) =>
			this.apiClient.postOnce<CreateAgentVaultSessionResponse>(`${BASE_PATH}/sessions`, data),

		update: (sessionId: string, data: UpdateAgentVaultSessionRequest) =>
			this.apiClient.patch<SingleAgentVaultSessionResponse>(`${BASE_PATH}/sessions/${segment(sessionId)}`, data),

		revoke: (sessionId: string) =>
			this.apiClient.post<RevokeAgentVaultSessionResponse>(`${BASE_PATH}/sessions/${segment(sessionId)}/revoke`)
	};

	accessBundles = {
		list: (params: ListAgentVaultAccessBundlesRequest) =>
			this.apiClient.get<ListAgentVaultAccessBundlesResponse>(`${BASE_PATH}/access-bundles`, { params }),

		get: (accessBundleId: string) =>
			this.apiClient.get<GetAgentVaultAccessBundleResponse>(
				`${BASE_PATH}/access-bundles/${segment(accessBundleId)}`
			),

		create: (data: CreateAgentVaultAccessBundleRequest) =>
			this.apiClient.postOnce<SingleAgentVaultAccessBundleResponse>(`${BASE_PATH}/access-bundles`, data),

		update: (accessBundleId: string, data: UpdateAgentVaultAccessBundleRequest) =>
			this.apiClient.patch<SingleAgentVaultAccessBundleResponse>(
				`${BASE_PATH}/access-bundles/${segment(accessBundleId)}`,
				data
			),

		delete: (accessBundleId: string) =>
			this.apiClient.delete<SingleAgentVaultAccessBundleResponse>(
				`${BASE_PATH}/access-bundles/${segment(accessBundleId)}`
			),

		listGrantees: (accessBundleId: string, params: ListAgentVaultAccessBundleMembersRequest) =>
			this.apiClient.get<ListAgentVaultGranteesResponse>(
				`${BASE_PATH}/access-bundles/${segment(accessBundleId)}/members`,
				{ params }
			),

		listAvailableGrantees: (accessBundleId: string, params: ListAgentVaultAccessBundleMembersRequest) =>
			this.apiClient.get<ListAgentVaultMembersResponse>(
				`${BASE_PATH}/access-bundles/${segment(accessBundleId)}/members/available`,
				{ params }
			),

		grant: (accessBundleId: string, data: ChangeAgentVaultAccessBundleGrantsRequest) =>
			this.apiClient.post<GrantAgentVaultAccessBundleResponse>(
				`${BASE_PATH}/access-bundles/${segment(accessBundleId)}/members`,
				data
			),

		revoke: (accessBundleId: string, data: ChangeAgentVaultAccessBundleGrantsRequest) =>
			this.apiClient.delete<RevokeAgentVaultAccessBundleResponse>(
				`${BASE_PATH}/access-bundles/${segment(accessBundleId)}/members`,
				{ data }
			)
	};

	delegations = {
		list: (params: ListAgentVaultDelegationsRequest) =>
			this.apiClient.get<ListAgentVaultDelegationsResponse>(`${BASE_PATH}/delegations`, { params }),

		get: (machineIdentityId: string) =>
			this.apiClient.get<SingleAgentVaultDelegationResponse>(
				`${BASE_PATH}/delegations/${segment(machineIdentityId)}`
			),

		set: (machineIdentityId: string, data: SetAgentVaultDelegationRequest) =>
			this.apiClient.put<SingleAgentVaultDelegationResponse>(
				`${BASE_PATH}/delegations/${segment(machineIdentityId)}`,
				data
			),

		delete: (machineIdentityId: string) =>
			this.apiClient.delete<DeleteAgentVaultDelegationResponse>(
				`${BASE_PATH}/delegations/${segment(machineIdentityId)}`
			),

		addSubjects: (machineIdentityId: string, data: ChangeAgentVaultDelegationSubjectsRequest) =>
			this.apiClient.post<SingleAgentVaultDelegationResponse>(
				`${BASE_PATH}/delegations/${segment(machineIdentityId)}/subjects`,
				data
			),

		removeSubjects: (machineIdentityId: string, data: ChangeAgentVaultDelegationSubjectsRequest) =>
			this.apiClient.delete<RemoveAgentVaultDelegationSubjectsResponse>(
				`${BASE_PATH}/delegations/${segment(machineIdentityId)}/subjects`,
				{ data }
			),

		listAvailableSubjects: (machineIdentityId: string, params: ListAvailableAgentVaultDelegationSubjectsRequest) =>
			this.apiClient.get<ListAgentVaultMembersResponse>(
				`${BASE_PATH}/delegations/${segment(machineIdentityId)}/subjects/available`,
				{ params }
			)
	};
}
