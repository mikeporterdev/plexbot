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

export interface QueueItem {
  series: Show;
  episode: Episode;
}

export enum RedownloadStatus {
  TRIGGERED_DOWNLOAD,
  CURRENTLY_DOWNLOADING,
}
