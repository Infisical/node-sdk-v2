import { Secret } from "./secrets";

export * from "./auth";
export * from "./secrets";
export * from "./dynamic-secrets";
export * from "./environments";
export * from "./projects";
export * from "./folders";

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

export interface CreateSecretResponse {
  secret: Secret;
}

export interface UpdateSecretResponse {
  secret: Secret;
}

export interface DeleteSecretResponse {
  secret: Secret;
}
