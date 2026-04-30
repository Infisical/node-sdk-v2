import { ProjectsApi } from "../api/endpoints/projects";
import { newInfisicalError } from "./errors";
import { CreateProjectOptions, InviteMemberToProjectOptions } from "../api/types/projects";

export default class ProjectsClient {
  constructor(private apiClient: ProjectsApi) {}

  listProjects = async () => {
    try {
      const res = await this.apiClient.listProjects();
      return res.projects;
    } catch (err) {
      throw newInfisicalError(err);
    }
  };

  create = async (options: CreateProjectOptions) => {
    try {
      const res = await this.apiClient.create(options);
      return res.project;
    } catch (err) {
      throw newInfisicalError(err);
    }
  };

  inviteMembers = async (options: InviteMemberToProjectOptions) => {
    try {
      if (!options.usernames?.length && !options.emails?.length) {
        throw new Error("Either usernames or emails must be provided");
      }

      const res = await this.apiClient.inviteMembers(options);
      return res.memberships;
    } catch (err) {
      throw newInfisicalError(err);
    }
  };
}
