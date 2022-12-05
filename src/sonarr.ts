import axios from 'axios';
import PlexbotError from './exceptions/PlexbotError';
import {
  Episode,
  GetActivityQueueResponse,
  QueueItem,
  RedownloadResponse,
  RedownloadStatus,
  Show
} from './types/types';
import { findMatching } from './get-fuzzy';

const sonarrUrl = process.env.SONARR_URL;
const sonarrApiKey = process.env.SONARR_API_KEY;

const connectionUrl = `${sonarrUrl}/api/v3`;

function buildConnectionString(command: string): string {
  return `${connectionUrl}/${command}?apiKey=${sonarrApiKey}`;
}

function buildConnectionStringWithId(command: string, id: number): string {
  return `${connectionUrl}/${command}/${id}/?apiKey=${sonarrApiKey}`;
}

export async function redownloadShow(showName: string, episodeNumber: string): Promise<RedownloadResponse> {
  if (!episodeNumber.toUpperCase().match(new RegExp('S\\d\\dE\\d\\d'))) {
    throw new PlexbotError('Invalid episode number, should be format S01E01');
  }

  const season = episodeNumber.substring(1, 3);
  const episode = episodeNumber.substring(4, 6);

  const shows = await getShows();

  const matchingShow = findMatching(shows, i => i.title, showName);

  if (!matchingShow) {
    throw new PlexbotError(`Could not find show with name ${showName} ¯\\_(ツ)_/¯`);
  }

  const episodesForShow = await getEpisodesForShow(matchingShow);

  const matchingEpisode = episodesForShow.find(
    i => zeroPad(i.episodeNumber, 2) === episode && zeroPad(i.seasonNumber, 2) === season,
  );

  if (!matchingEpisode) {
    throw new PlexbotError(`Could not find episode ${episodeNumber} inside ${showName}`);
  }

  if (matchingEpisode.episodeFileId !== 0) {
    console.log('Found file for episode, deleting');
    await deleteEpisode(matchingEpisode);
  }

  const queue = await getActivityQueue();
  if (queue.find(i => i.episodeId === matchingEpisode.id)) {
    return { status: RedownloadStatus.CURRENTLY_DOWNLOADING, show: matchingShow };
  }

  console.log('Triggering download for episode');
  await searchForEpisode(matchingEpisode.id);

  return { status: RedownloadStatus.TRIGGERED_DOWNLOAD, show: matchingShow };
}

async function getEpisodesForShow(show: Show): Promise<Episode[]> {
  const url = `${buildConnectionString('episode')}&seriesId=${show.id}`;
  const axiosResponse = await axios.get<Episode[]>(url);
  return axiosResponse.data;
}

async function getShows(): Promise<Show[]> {
  // TODO: implement redis
  const axiosResponse = await axios.get<Show[]>(buildConnectionString('series'));
  return axiosResponse.data;
}

async function deleteEpisode(episode: { episodeFileId: number }): Promise<void> {
  const url = buildConnectionStringWithId('episodeFile', episode.episodeFileId);
  await axios.delete(url);
}

async function searchForEpisode(episodeId: number): Promise<void> {
  const url = buildConnectionString('command');
  await axios.post(url, { name: 'EpisodeSearch', episodeIds: [episodeId] });
}

function zeroPad(input: number, length: number): string {
  return (Array(length + 1).join('0') + input).slice(-length);
}

async function getActivityQueue(): Promise<QueueItem[]> {
  const url = buildConnectionString('queue');
  const axiosResponse = await axios.get<GetActivityQueueResponse>(url);
  return axiosResponse.data.records;
}
