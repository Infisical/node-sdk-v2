import { ApiClient } from "../base";
import { CreateFolderRequest, CreateFolderResponse, ListFoldersRequest, ListFoldersResponse } from "../types";

export class FoldersApi {
  constructor(private apiClient: ApiClient) {}

  async create(data: CreateFolderRequest): Promise<CreateFolderResponse> {
    return this.apiClient.post<CreateFolderResponse>("/api/v1/folders", data);
  }

  async listFolders(queryParams: ListFoldersRequest): Promise<ListFoldersResponse> {
    return this.apiClient.get<ListFoldersResponse>("/api/v1/folders", {
      params: queryParams
    });
  }
}
