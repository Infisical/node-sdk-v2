export interface Environment {
  id: string;
  name: string;
  slug: string;
  position: number;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEnvironmentRequest {
  name: string;
  projectId: string;
  slug: string;
  position?: number;
}

export type CreateEnvironmentResponse = {
  message: string;
  workspace: string;
  environment: Environment;
};

export type CreateEnvironmentOptions = {
  name: string;
  projectId: string;
  slug: string;
  position?: number;
};
