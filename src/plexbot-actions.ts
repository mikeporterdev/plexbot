import { RedownloadStatus } from './types/types';
import { redownloadShow } from './sonarr';

export async function redownloadTV(mediaName: string, episodeNumber: string): Promise<RedownloadStatus> {
  if (!episodeNumber) {
    throw new Error('You must provide an episode number for TV! (format example: S01E03');
  }

  return await redownloadShow(mediaName, episodeNumber);
}
