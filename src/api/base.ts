import ky, { KyInstance, Options as KyOptions } from "ky";

export interface ApiClientConfig {
  baseURL: string;
  headers?: Record<string, string>;
  timeout?: number;
}

export class ApiClient {
  private client: KyInstance;

  constructor(config: ApiClientConfig) {
    const maxRetries = 4;
    const initialRetryDelay = 1000;
    const backoffFactor = 2;

    this.client = ky.create({
      baseUrl: config.baseURL,
      headers: config.headers || {},
      timeout: config.timeout || 10000,
      retry: {
        limit: maxRetries,
        methods: ['get', 'post', 'put', 'patch', 'head', 'delete', 'options', 'trace'],
        statusCodes: [429],
        delay: (attemptCount) => initialRetryDelay * Math.pow(backoffFactor, attemptCount - 1),
        jitter: (delay) => delay * (0.8 + Math.random() * 0.4),
      }
    });
  }

  public setAccessToken(token: string) {
    this.client = this.client.extend({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  public async get<T>(url: string, config?: KyOptions): Promise<T> {
    return await this.client.get<T>(url, config).json();
  }

  public async post<T>(
    url: string,
    data?: Record<string, any>,
    config?: KyOptions
  ): Promise<T> {
    return await this.client.post<T>(url, {
      ...config,
      json: data,
    }).json();
  }

  public async patch<T>(
    url: string,
    data?: Record<string, any>,
    config?: KyOptions
  ): Promise<T> {
    return await this.client.patch<T>(url, {
      ...config,
      json: data,
    }).json();
  }

  public async delete<T>(
    url: string,
    data?: Record<string, any>,
    config?: KyOptions
  ): Promise<T> {
    return await this.client.delete<T>(url, {
      ...config,
      json: data,
    }).json();
  }
}
