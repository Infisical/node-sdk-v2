import { KmsApi } from "../api/endpoints/kms";
import { ListKmsOptions } from "../api/types";
import { newInfisicalError } from "./errors";

export default class KmsClient {
    constructor(private apiClient: KmsApi) {}

    listKeys = async (options: ListKmsOptions) => {
        try {
            const res = await this.apiClient.ListKeys({
                projectId: options.projectId,
                offset: options.offset ? options.offset : 0,
                limit: options.limit ? options.limit : 100,
                orderBy: options.orderBy,
                orderDirection: options.orderDirection,
                search: options.search,
            })
            return res;
        } catch (err) {
            throw newInfisicalError(err);
        }
    }
}