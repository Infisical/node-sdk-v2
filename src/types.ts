export type InfisicalSDKOptions = {
	/**
	 * The base URL for Infisical Defaults to `https://app.infisical.com`.
	 */
	siteUrl?: string;
	/**
	 * Whether to automatically refresh the access token when it expires. Defaults to `true`.
	 */
	autoTokenRefresh?: boolean;
};

export type TTokenDetails = {
	accessToken: string;
	expiresIn: number;
	accessTokenMaxTTL: number;
	fetchedTime: Date;
	firstFetchTime: Date;
};

export type UniversalAuthCredentials = {
	clientId: string;
	clientSecret: string;
};

export type AWSIamCredentials = {
	identityId: string;
};

export type AccessTokenCredentials = {
	accessToken: string;
};

export type TAuthCredentials =
	| {
			type: AuthMethod.UniversalAuth;
			credentials: UniversalAuthCredentials;
	  }
	| {
			type: AuthMethod.AWSIam;
			credentials: AWSIamCredentials;
	  }
	| {
			type: AuthMethod.AccessToken;
			credentials: AccessTokenCredentials;
	  };

export enum AuthMethod {
	UniversalAuth = "universal-auth",
	AWSIam = "aws-iam",
	AccessToken = "accessToken"
}
