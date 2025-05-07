export interface UniversalAuthLoginRequest {
  clientId: string;
  clientSecret: string;
}

export interface UniversalAuthLoginResponse {
  accessToken: string;
  expiresIn: number;
}

export interface AwsIamAuthLoginRequest {
  identityId: string;
  iamHttpRequestMethod: string;
  iamRequestBody: string;
  iamRequestHeaders: string;
}

export interface AwsIamAuthLoginResponse {
  accessToken: string;
  expiresIn: number;
}

export interface TokenRenewRequest {
  accessToken: string;
}

export interface TokenRenewResponse {
  accessToken: string;
  expiresIn: number;
}
