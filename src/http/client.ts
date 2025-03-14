import * as net from "net";
import * as tls from "tls";
import { URL } from "url";
import {
  HttpResponse,
  HttpRequestOptions,
  ContentFormat,
} from "../types/http.js";
import config from "../config.js";
import { CacheService } from "../services/cache.js";
import chalk from "chalk";

export class HttpClient {
  private cacheService: CacheService;

  constructor() {
    this.cacheService = CacheService.getInstance();
  }

  private buildHeaders(
    hostname: string,
    customHeaders: Record<string, string> = {},
    preferredFormat?: ContentFormat
  ): Record<string, string> {
    const accept =
      preferredFormat === "json"
        ? "application/json;q=1.0, text/html;q=0.8"
        : "text/html;q=1.0, application/json;q=0.8";

    return {
      Host: hostname,
      Connection: "close",
      Accept: accept,
      "User-Agent": config.http.userAgent,
      ...customHeaders,
    };
  }

  private buildRequestLines(
    method: string,
    path: string,
    search: string,
    headers: Record<string, string>
  ): string[] {
    // example:
    // GET / HTTP/1.1
    // Host: example.com
    // User-Agent: curl/8.0.1
    // Accept: */*
    return [
      `${method} ${path || "/"}${search || ""} HTTP/1.1`,
      ...Object.entries(headers).map(([key, value]) => `${key}: ${value}`),
      "",
      "",
    ];
  }

  async request(
    urlString: string,
    options: HttpRequestOptions = {},
    redirectCount = 0
  ): Promise<HttpResponse> {
    if (redirectCount >= config.http.maxRedirects) {
      throw new Error(
        `Maximum number of redirects (${config.http.maxRedirects}) exceeded`
      );
    }

    if (
      (options.method === undefined || options.method === "GET") &&
      config.cache.enabled
    ) {
      const cachedResponse = this.cacheService.get(urlString);
      if (cachedResponse) {
        console.log(chalk.green("Using cached response"));
        return cachedResponse;
      }
    }

    const url = new URL(urlString);
    const isHttps = url.protocol === "https:";
    const port = url.port ? parseInt(url.port, 10) : isHttps ? 443 : 80;

    return new Promise((resolve, reject) => {
      const connectOptions = {
        host: url.hostname,
        port: port,
        servername: url.hostname,
      };

      const socket = isHttps
        ? tls.connect(connectOptions, () => {
            sendRequest();
          })
        : net.connect(port, url.hostname, () => {
            sendRequest();
          });

      const sendRequest = () => {
        const headers = this.buildHeaders(
          url.hostname,
          options.headers,
          options.preferredFormat
        );
        const requestLines = this.buildRequestLines(
          options.method || "GET",
          url.pathname,
          url.search,
          headers
        );
        socket.write(requestLines.join("\r\n"));
      };

      let rawResponse = "";
      socket.on("data", (chunk) => {
        rawResponse += chunk;
      });

      socket.on("end", () => {
        try {
          const response = this.parseResponse(rawResponse);

          const REDIRECT_CODES = [301, 302, 303, 307, 308];
          if (
            REDIRECT_CODES.includes(response.statusCode) &&
            response.headers.location
          ) {
            // relative URLs
            const redirectUrl = new URL(
              response.headers.location,
              response.headers.location.startsWith("http")
                ? undefined
                : urlString
            ).toString();

            // change method to GET unless it's 307 or 308
            const redirectMethod = [307, 308].includes(response.statusCode)
              ? options.method
              : "GET";

            this.request(
              redirectUrl,
              {
                ...options,
                method: redirectMethod,
              },
              redirectCount + 1
            )
              .then(resolve)
              .catch(reject);
            return;
          }

          const isCacheable =
            (options.method === undefined || options.method === "GET") &&
            response.statusCode >= 200 &&
            response.statusCode < 300 &&
            config.cache.enabled;
          if (isCacheable) {
            this.cacheService.set(urlString, response);
          }

          resolve(response);
        } catch (error) {
          reject(error);
        }
      });

      socket.on("error", (error) => {
        reject(error);
      });
    });
  }

  private parseResponse(rawResponse: string): HttpResponse {
    const [headerSection, ...bodyParts] = rawResponse.split("\r\n\r\n");
    const body = bodyParts.join("\r\n\r\n");
    const [statusLine, ...headerLines] = headerSection.split("\r\n");
    const [, statusCode] = statusLine.match(/HTTP\/\d\.\d (\d{3})/) || [];

    const headers: Record<string, string> = {};
    for (const line of headerLines) {
      const [key, ...values] = line.split(":");
      if (key) {
        headers[key.trim().toLowerCase()] = values.join(":").trim();
      }
    }

    return {
      statusCode: parseInt(statusCode, 10),
      headers,
      body,
    };
  }

  clearCache(): void {
    this.cacheService.clear();
  }
}
