export interface Folder {
  id: string;
  name: string;
  path: string;
  workspaceId: string;
  environment: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
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

