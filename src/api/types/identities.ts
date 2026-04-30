export interface IdentityDetails {
  id: string;
  role: string;
  roleId: string | null;
  orgId: string;
  createdAt: string;
  updatedAt: string;
  identityId: string;
  lastLoginAuthMethod: string | null;
  lastLoginTime: string | null;
  identity: {
    name: string;
    id: string;
    hasDeleteProtection: boolean;
    orgId: string;
    authMethods: string[];
  };
}

export interface GetIdentityByIdResponse {
  identity: IdentityDetails;
}
