export type SendMethod = 'roi' | 'direct';

export interface SendToCvatDto {
    /**
     * Absolute path to video file on the host (from VISTA's hostPath)
     */
    videoPath: string;

    /**
     * Method to use:
     * - 'roi': YOLO ROI extraction → image upload to CVAT
     * - 'direct': Direct video upload to CVAT
     */
    method: SendMethod;

    /**
     * CVAT project name
     */
    cvatProject: string;

    /**
     * CVAT organization
     */
    cvatOrg: string;

    /**
     * Model name for ROI extraction (only for 'roi' method)
     * @example 'belt.pt'
     */
    modelName?: string;

    /**
     * Detection confidence threshold (only for 'roi' method)
     * @default 0.5
     */
    confidence?: number;

    /**
     * Padding around detection box (only for 'roi' method)
     * @default 30
     */
    padding?: number;

    /**
     * Optional CVAT assignee ID
     */
    assigneeId?: string;
}

export interface TriggerResponseDto {
    success: boolean;
    queueUrl?: string;
    error?: string;
    jobName?: string;
}
