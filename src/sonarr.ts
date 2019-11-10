import axios from 'axios';
import SonarrError from './exceptions/SonarrError';
import FuzzySet = require('fuzzyset.js');
import { Episode, QueueItem, RedownloadStatus, Show } from './types/types';

const sonarrUrl = process.env.SONARR_URL;
const sonarrApiKey = process.env.SONARR_API_KEY;

const connectionUrl = `${sonarrUrl}/api`;

function buildConnectionString(command: string): string {
  return `${connectionUrl}/${command}?apiKey=${sonarrApiKey}`;
}

function buildConnectionStringWithId(command: string, id: number): string {
  return `${connectionUrl}/${command}/${id}/?apiKey=${sonarrApiKey}`;
}

export async function redownloadShow(showName: string, episodeNumber: string): Promise<RedownloadStatus> {
  if (!episodeNumber.toUpperCase().match(new RegExp('S\\d\\dE\\d\\d'))) {
    throw new SonarrError('Invalid episode number, should be format S01E01');
  }

  const season = episodeNumber.substring(1, 3);
  const episode = episodeNumber.substring(4, 6);

  const shows = await getShows();

  const matchingShow = await findMatchingShow(shows, showName);

  if (!matchingShow) {
    throw new SonarrError(`Could not find show with name ${showName} ¯\\_(ツ)_/¯`);
  }

  console.log('Getting episode');
  const episodesForShow = await getEpisodesForShow(matchingShow);

  const matchingEpisode = episodesForShow.find(
    i => zeroPad(i.episodeNumber, 2) === episode && zeroPad(i.seasonNumber, 2) === season,
  );

  if (!matchingEpisode) {
    throw new SonarrError(`Could not find episode ${episodeNumber} inside ${showName}`);
  }

  if (matchingEpisode.episodeFileId !== 0) {
    console.log('Found file for episode, deleting');
    await deleteEpisode(matchingEpisode);
  }

  const queue = await getActivityQueue();
  if (queue.find(i => i.episode.id === matchingEpisode.id)) {
    return RedownloadStatus.CURRENTLY_DOWNLOADING;
  }

  console.log('Triggering download for episode');
  await searchForEpisode(matchingEpisode.id);

  return RedownloadStatus.TRIGGERED_DOWNLOAD;
}

function findMatchingShow(shows: Show[], showName: string): Show | null {
  const exactMatch = shows.find(i => i.title.toLowerCase() === showName.toLowerCase());
  if (exactMatch) {
    return exactMatch;
  }

  const fuzzySet = FuzzySet(shows.map(i => i.title));
  const closestMatches = fuzzySet.get(showName);

  if (closestMatches) {
    throw new SonarrError(`Couldn't find show with name ${showName}, did you mean ${closestMatches[0][1]}?`);
  }

  return null;
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
  const axiosResponse = await axios.get<QueueItem[]>(url);
  return axiosResponse.data;
}
