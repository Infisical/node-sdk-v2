export interface Project {
  id: string;
  name: string;
  slug: string;
  description?: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  projectName: string;
  type: string;
  projectDescription?: string;
  slug?: string;
  template?: string;
  kmsKeyId?: string;
}

export interface CreateProjectResponse {
  project: Project;
}

export interface InviteMembersRequest {
  projectId: string;
  emails?: string[];
  usernames?: string[];
  roleSlugs?: string[];
}

export interface Membership {
  id: string;
  userId: string;
  projectId: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface InviteMembersResponse {
  memberships: Membership[];
}

export type CreateProjectOptions = {
  projectName: string;
  type: string;
  projectDescription?: string;
  slug?: string;
  template?: string;
  kmsKeyId?: string;
};

export type InviteMemberToProjectOptions = {
  projectId: string;
  emails?: string[];
  usernames?: string[];
  roleSlugs?: string[];
};
