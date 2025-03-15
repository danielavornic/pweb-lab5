import { HttpResponse } from "../types/http.js";
import config from "../config.js";
import chalk from "chalk";
import fs from "fs";
import path from "path";
import os from "os";

type CacheEntry = {
  response: HttpResponse;
  timestamp: number;
};

export class CacheService {
  private static instance: CacheService;
  private cache: Map<string, CacheEntry>;
  private cacheDir: string;
  private cacheFile: string;

  constructor() {
    this.cache = new Map();
    this.cacheDir = path.join(os.homedir(), ".go2web");
    this.cacheFile = path.join(this.cacheDir, "cache.json");
    this.initCache();
  }

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  private initCache(): void {
    try {
      if (!fs.existsSync(this.cacheDir)) {
        fs.mkdirSync(this.cacheDir, { recursive: true });
      }

      if (fs.existsSync(this.cacheFile)) {
        const data = fs.readFileSync(this.cacheFile, "utf-8");
        const entries = JSON.parse(data);

        for (const [key, value] of Object.entries(entries)) {
          this.cache.set(key, value as CacheEntry);
        }
      }
    } catch (error) {
      console.error("Failed to initialize cache:", error);
    }
  }

  private saveCache(): void {
    try {
      const entries = Object.fromEntries(this.cache.entries());
      fs.writeFileSync(this.cacheFile, JSON.stringify(entries, null, 2));
    } catch (error) {
      console.error("Failed to save cache:", error);
    }
  }

  get(url: string): HttpResponse | null {
    if (!config.cache.enabled) return null;

    const entry = this.cache.get(url);
    if (!entry) {
      return null;
    }

    // if cache is still valid
    const now = Date.now();
    if (now - entry.timestamp > config.cache.maxAge) {
      this.cache.delete(url);
      this.saveCache();
      return null;
    }

    return entry.response;
  }

  set(url: string, response: HttpResponse): void {
    if (!config.cache.enabled) return;

    // error responses
    if (response.statusCode >= 400) {
      return;
    }

    const cacheControl = response.headers["cache-control"] || "";
    if (cacheControl.includes("no-store")) {
      return;
    }

    if (this.cache.size >= config.cache.maxSize) {
      const oldestKey = this.findOldestEntry();
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(url, {
      response,
      timestamp: Date.now(),
    });

    this.saveCache();
  }

  clear(): void {
    this.cache.clear();
    this.saveCache();
  }

  private findOldestEntry(): string | null {
    const oldestTime = Math.min(
      ...Object.values(this.cache).map((entry) => entry.timestamp)
    );
    const oldestKey = Object.keys(this.cache).find(
      (key: string) => this.cache.get(key)?.timestamp === oldestTime
    );

    return oldestKey ?? null;
  }

  isEmpty(): boolean {
    return this.cache.size === 0;
  }
}
