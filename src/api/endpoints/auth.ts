import { ApiClient } from "../base";
import {
  UniversalAuthLoginRequest,
  UniversalAuthLoginResponse,
  AwsIamAuthLoginRequest,
  AwsIamAuthLoginResponse,
  TokenRenewRequest,
  TokenRenewResponse,
} from "../types";

export class AuthApi {
  constructor(private apiClient: ApiClient) {}

  async universalAuthLogin(
    data: UniversalAuthLoginRequest
  ): Promise<UniversalAuthLoginResponse> {
    return this.apiClient.post<UniversalAuthLoginResponse>(
      "/api/v1/auth/universal-auth/login",
      data
    );
  }

  async awsIamAuthLogin(
    data: AwsIamAuthLoginRequest
  ): Promise<AwsIamAuthLoginResponse> {
    return this.apiClient.post<AwsIamAuthLoginResponse>(
      "/api/v1/auth/aws-auth/login",
      data
    );
  }

  async renewToken(data: TokenRenewRequest): Promise<TokenRenewResponse> {
    return this.apiClient.post<TokenRenewResponse>(
      "/api/v1/auth/token/renew",
      data
    );
  }
}
