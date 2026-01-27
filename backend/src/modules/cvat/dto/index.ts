export interface CvatTaskInfo {
    id: number;
    name: string;
    projectId?: number;
    projectName?: string;
    stage: string;
    url: string;
}

export interface CvatTasksResponse {
    count: number;
    results: CvatTaskResult[];
}

export interface CvatTaskResult {
    id: number;
    name: string;
    project_id: number | null;
    status: string; // task status (new, in progress, completed)
    url: string;
}

export interface CvatVideoStatus {
    exists: boolean;
    taskId?: number;
    taskUrl?: string;
    projectName?: string;
    stage?: string;
}

