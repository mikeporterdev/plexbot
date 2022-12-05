export interface Show {
  id: number;
  title: string;
}

export interface Episode {
  id: number;
  seriesId: number;
  episodeFileId: number;
  seasonNumber: number;
  episodeNumber: number;
}

export interface GetActivityQueueResponse {
  records: QueueItem[];
}

export interface QueueItem {
  episodeId: number
}

export enum RedownloadStatus {
  TRIGGERED_DOWNLOAD,
  CURRENTLY_DOWNLOADING,
}

export interface RedownloadResponse {
  status: RedownloadStatus;
  show: Show;
}
