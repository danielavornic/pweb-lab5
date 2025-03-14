import * as net from "net";
import * as tls from "tls";
import { URL } from "url";
import { HttpResponse, HttpRequestOptions } from "../types/http.js";

export class HttpClient {
  private buildHeaders(
    hostname: string,
    customHeaders: Record<string, string> = {},
    preferredFormat?: "html" | "json"
  ): Record<string, string> {
    const accept =
      preferredFormat === "json"
        ? "application/json;q=1.0, text/html;q=0.8"
        : "text/html;q=1.0, application/json;q=0.8";

    return {
      Host: hostname,
      Connection: "close",
      Accept: accept,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
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
    options: HttpRequestOptions = {}
  ): Promise<HttpResponse> {
    const url = new URL(urlString);
    const isHttps = url.protocol === "https:";
    const port = Number(url.port) || (isHttps ? 443 : 80);

    return new Promise((resolve, reject) => {
      const connectOptions = {
        host: url.hostname,
        port: port,
        servername: url.hostname,
      } as tls.ConnectionOptions;

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
          const REDIRECT_CODES = [301, 302, 307, 308];

          if (
            REDIRECT_CODES.includes(response.statusCode) &&
            response.headers.location
          ) {
            this.request(response.headers.location, options)
              .then(resolve)
              .catch(reject);
          } else {
            resolve(response);
          }
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
}
