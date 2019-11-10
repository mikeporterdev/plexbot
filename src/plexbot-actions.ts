import Sonarr from './sonarr';
import { RedownloadStatus } from './types/types';

const sonarr = new Sonarr();

export async function redownloadTV(mediaName: string, episodeNumber: string): Promise<RedownloadStatus> {
  if (!episodeNumber) {
    throw new Error('You must provide an episode number for TV! (format example: S01E03');
  }

  return await sonarr.redownloadShow(mediaName, episodeNumber);
}
