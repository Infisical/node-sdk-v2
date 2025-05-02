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
  environment: Environment;
};
