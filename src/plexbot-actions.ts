import Sonarr from './sonarr';

const sonarr = new Sonarr();

export async function redownloadTV(mediaName: string, episodeNumber: string) {
  if (!episodeNumber) {
    throw new Error('You must provide an episode number for TV! (format example: S01E03');
  }

  return await sonarr.redownloadShow(mediaName, episodeNumber);
}
