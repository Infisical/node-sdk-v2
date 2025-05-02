import { FoldersApi } from "../api/endpoints/folders";
import { newInfisicalError } from "./errors";

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

export default class FoldersClient {
  constructor(private apiClient: FoldersApi) {}

  create = async (options: CreateFolderOptions) => {
    try {
      const res = await this.apiClient.create({
        name: options.name,
        path: options.path,
        workspaceId: options.projectId,
        environment: options.environment,
        description: options.description,
      });
      return res.folder;
    } catch (err) {
      throw newInfisicalError(err);
    }
  };

  listFolders = async (options: ListFoldersOptions) => {
    try {
      const res = await this.apiClient.listFolders({
        environment: options.environment,
        workspaceId: options.projectId,
        path: options.path,
        recursive: options.recursive,
        lastSecretModified: options.lastSecretModified,
      });
      return res.folders;
    } catch (err) {
      throw newInfisicalError(err);
    }
  };
}
