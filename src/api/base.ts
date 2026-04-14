import ky, { KyInstance, Options as KyOptions } from "ky";

export interface ApiClientConfig {
  baseURL: string;
  headers?: Record<string, string>;
  timeout?: number;
}

const isJsonContentType = (contentType: string): boolean =>
  contentType.split(";")[0]?.trim().toLowerCase() === "application/json";

export class ApiClient {
  private client: KyInstance;

  constructor(config: ApiClientConfig) {
    const maxRetries = 4;
    const initialRetryDelay = 1000;
    const backoffFactor = 2;

    // Ky reads error response bodies before retrying HTTP errors (including 429), so the
    // underlying connection is not left with an unconsumed body during backoff (unlike ad-hoc fetch retries).
    this.client = ky.create({
      baseUrl: config.baseURL,
      headers: config.headers || {},
      timeout: config.timeout || 10000,
      retry: {
        limit: maxRetries,
        methods: ['get', 'post', 'put', 'patch', 'head', 'delete', 'options', 'trace'],
        statusCodes: [429],
        delay: (attemptCount: number) =>
          initialRetryDelay * Math.pow(backoffFactor, attemptCount - 1),
        jitter: (delay: number) => delay * (0.8 + Math.random() * 0.4),
      }
    });
  }

  /** Maps JSON vs raw body for ky: non-JSON Content-Type must use a string or URLSearchParams, not a plain object. */
  private optionsWithBody(data: unknown, config?: KyOptions): KyOptions {
    if (data === undefined) {
      return { ...config };
    }

    const headers = config?.headers as Record<string, string | undefined> | undefined;

    const explicitCt =
      headers?.["Content-Type"] ?? headers?.["content-type"];

    if (explicitCt === undefined || isJsonContentType(explicitCt)) {
      return { ...config, json: data };
    }

    if (typeof data === "string") {
      return { ...config, body: data };
    }

    if (data instanceof URLSearchParams) {
      return { ...config, body: data.toString() };
    }

    throw new TypeError(
      `Request body for Content-Type "${explicitCt}" must be a string or URLSearchParams; received ${Object.prototype.toString.call(data)}`
    );
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
    data?: unknown,
    config?: KyOptions
  ): Promise<T> {
    return await this.client.post<T>(url, this.optionsWithBody(data, config)).json();
  }

  public async patch<T>(
    url: string,
    data?: unknown,
    config?: KyOptions
  ): Promise<T> {
    return await this.client.patch<T>(url, this.optionsWithBody(data, config)).json();
  }

  public async delete<T>(
    url: string,
    data?: unknown,
    config?: KyOptions
  ): Promise<T> {
    return await this.client.delete<T>(url, this.optionsWithBody(data, config)).json();
  }
}
