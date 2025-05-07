export interface Folder {
  id: string;
  name: string;
  envId: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  parentId?: string;
  isReserved?: boolean;
  lastSecretModified?: string;
  version?: number;
}

export interface CreateFolderRequest {
  name: string;
  path: string;
  workspaceId: string;
  environment: string;
  description?: string;
}

export interface ListFoldersRequest {
  environment: string;
  workspaceId: string;
  path?: string;
  recursive?: boolean;
  lastSecretModified?: string;
}

export interface CreateFolderResponse {
  folder: Folder;
}

export interface ListFoldersResponse {
  folders: Folder[];
}

export type CreateFolderOptions = {
  name: string;
  path: string;
  projectId: string;
  environment: string;
  description?: string;
};

export type ListFoldersOptions = {
  environment: string;
  projectId: string;
  path?: string;
  recursive?: boolean;
  lastSecretModified?: string;
};
