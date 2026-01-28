export interface SettingsDto {
    // CVAT
    cvatUrl: string | null;
    cvatUsername: string | null;
    cvatPassword: string | null;
    cvatCacheTimeoutMs: number;
    // Jenkins
    jenkinsUrl: string | null;
    jenkinsUsername: string | null;
    jenkinsApiToken: string | null;
}

export interface UpdateSettingsDto {
    cvatUrl?: string;
    cvatUsername?: string;
    cvatPassword?: string;
    cvatCacheTimeoutMs?: number;
    jenkinsUrl?: string;
    jenkinsUsername?: string;
    jenkinsApiToken?: string;
}

export interface CvatConfig {
    url: string;
    username: string;
    password: string;
    cacheTimeoutMs: number;
}

export interface JenkinsConfig {
    url: string;
    username: string;
    apiToken: string;
}
