import { ApiClient } from "./api/base";
import { AuthApi } from "./api/endpoints/auth";
import { SecretsApi } from "./api/endpoints/secrets";
import { DynamicSecretsApi } from "./api/endpoints/dynamic-secrets";
import { EnvironmentsApi } from "./api/endpoints/environments";
import { ProjectsApi } from "./api/endpoints/projects";
import { FoldersApi } from "./api/endpoints/folders";

import SecretsClient from "./custom/secrets";
import AuthClient from "./custom/auth";
import DynamicSecretsClient from "./custom/dynamic-secrets";
import EnvironmentsClient from "./custom/environments";
import ProjectsClient from "./custom/projects";
import FoldersClient from "./custom/folders";

import * as ApiTypes from "./api/types";

type InfisicalSDKOptions = {
  siteUrl?: string;
};

class InfisicalSDK {
  private apiClient: ApiClient;

  // API instances
  private authApi: AuthApi;
  private secretsApi: SecretsApi;
  private dynamicSecretsApi: DynamicSecretsApi;
  private environmentsApi: EnvironmentsApi;
  private projectsApi: ProjectsApi;
  private foldersApi: FoldersApi;

  // Domain clients
  private authClient: AuthClient;
  private secretsClient: SecretsClient;
  private dynamicSecretsClient: DynamicSecretsClient;
  private environmentsClient: EnvironmentsClient;
  private projectsClient: ProjectsClient;
  private foldersClient: FoldersClient;

  constructor(options?: InfisicalSDKOptions) {
    const baseURL = options?.siteUrl || "https://app.infisical.com";

    // Initialize the base API client
    this.apiClient = new ApiClient({ baseURL });

    // Initialize API service instances
    this.authApi = new AuthApi(this.apiClient);
    this.secretsApi = new SecretsApi(this.apiClient);
    this.dynamicSecretsApi = new DynamicSecretsApi(this.apiClient);
    this.environmentsApi = new EnvironmentsApi(this.apiClient);
    this.projectsApi = new ProjectsApi(this.apiClient);
    this.foldersApi = new FoldersApi(this.apiClient);

    // Initialize domain clients
    this.authClient = new AuthClient(
      this.authenticate.bind(this),
      this.authApi
    );
    this.secretsClient = new SecretsClient(this.secretsApi);
    this.dynamicSecretsClient = new DynamicSecretsClient(
      this.dynamicSecretsApi
    );
    this.environmentsClient = new EnvironmentsClient(this.environmentsApi);
    this.projectsClient = new ProjectsClient(this.projectsApi);
    this.foldersClient = new FoldersClient(this.foldersApi);
  }

  private authenticate(accessToken: string) {
    // Set the token on the API client
    this.apiClient.setAccessToken(accessToken);

    // Reinitialize the auth client with the token
    this.authClient = new AuthClient(
      this.authenticate.bind(this),
      this.authApi,
      accessToken
    );

    return this;
  }

  // Public methods to access domain clients
  secrets = () => this.secretsClient;
  environments = () => this.environmentsClient;
  projects = () => this.projectsClient;
  folders = () => this.foldersClient;
  dynamicSecrets = () => this.dynamicSecretsClient;
  auth = () => this.authClient;
}

// Export main SDK class
export { InfisicalSDK, ApiTypes };

// Export types and enums from schemas
export {
  TDynamicSecretProvider,
  DynamicSecretProviders,
} from "./custom/schemas";
