import ky, { type Options, type KyInstance } from "ky";

export interface ApiClientConfig {
  baseURL: string;
  headers?: Options["headers"];
  timeout?: number;
}

export class ApiClient {
  private client: KyInstance;

  constructor(config: ApiClientConfig) {
    this.client = ky.create({
      prefixUrl: config.baseURL,
      headers: config.headers || {},
      timeout: config.timeout || 10000,
      retry: {
        limit: 4,
        methods: ['get', 'post', 'put', 'delete', 'patch'],
        statusCodes: [429],
        delay: attemptCount => 1000 * Math.pow(2, attemptCount - 1),
        jitter: (delay) => {
          const jitterAmount = delay * 0.2;
          return delay + (Math.random() * 2 - 1) * jitterAmount;
        },
        retryOnTimeout: true, // to match network error behavior
      },
    });
  }

  public setAccessToken(token: string) {
    this.client = this.client.extend({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  public async get<T>(url: string, config?: Options): Promise<T> {
    return await this.client.get(url, config).json<T>();
  }

  public async post<T, TData = unknown>(
    url: string,
    data?: TData,
    config?: Options,
  ): Promise<T> {
    return await this.client.post(url, { ...config, json: data }).json<T>();
  }

  public async patch<T, TData = unknown>(
    url: string,
    data?: TData,
    config?: Options,
  ): Promise<T> {
    return await this.client.patch(url, { json: data, ...config }).json<T>();
  }

  public async delete<T, TData = unknown>(url: string, data?: TData, config?: Options): Promise<T> {
    return await this.client.delete(url, { json: data, ...config }).json<T>();
  }
}
