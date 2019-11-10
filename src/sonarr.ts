import axios from 'axios';
import SonarrError from './exceptions/SonarrError';
import FuzzySet = require('fuzzyset.js');

const sonarrUrl = process.env.SONARR_URL;
const sonarrApiKey = process.env.SONARR_API_KEY;
export default class Sonarr {
  private readonly connectionUrl: string;

  constructor() {
    this.connectionUrl = `${sonarrUrl}/api`;
  }

  private buildConnectionString(command: string): string {
    return `${this.connectionUrl}/${command}?apiKey=${sonarrApiKey}`;
  }

  private buildConnectionStringWithId(command: string, id: number): string {
    return `${this.connectionUrl}/${command}/${id}/?apiKey=${sonarrApiKey}`;
  }

  public async redownloadShow(showName: string, episodeNumber: string): Promise<RedownloadStatus> {
    if (!episodeNumber.toUpperCase().match(new RegExp('S\\d\\dE\\d\\d'))) {
      throw new SonarrError('Invalid episode number, should be format S01E01');
    }

    const season = episodeNumber.substring(1, 3);
    const episode = episodeNumber.substring(4, 6);

    const shows = await this.getShows(showName);

    const matchingShow = await this.findMatchingShow(shows, showName);

    if (!matchingShow) {
      throw new SonarrError(`Could not find show with name ${showName} ¯\\_(ツ)_/¯`);
    }

    console.log('Getting episode');
    const episodesForShow = await this.getEpisodesForShow(matchingShow);

    const matchingEpisode = episodesForShow.find(i => this.zeroPad(i.episodeNumber, 2) === episode && this.zeroPad(i.seasonNumber, 2) === season);

    if (!matchingEpisode) {
      throw new SonarrError(`Could not find episode ${episodeNumber} inside ${showName}`);
    }

    if (matchingEpisode.episodeFileId !== 0) {
      console.log('Found file for episode, deleting');
      await this.deleteEpisode(matchingEpisode);
    }

    let queue = await this.getActivityQueue();
    if (queue.find(i => i.episode.id === matchingEpisode.id)) {
      return RedownloadStatus.CURRENTLY_DOWNLOADING;
    }

    console.log('Triggering download for episode');
    await this.searchForEpisode(matchingEpisode.id);

    return RedownloadStatus.TRIGGERED_DOWNLOAD;
  }

  private findMatchingShow(shows: Show[], showName: string): Show | null {
    const exactMatch = shows.find(i => i.title.toLowerCase() === showName.toLowerCase());
    if (exactMatch) {
      return exactMatch;
    }

    const fuzzySet = FuzzySet(shows.map(i => i.title));
    let closestMatches = fuzzySet.get(showName);

    if (closestMatches) {
      throw new SonarrError(`Couldn't find show with name ${showName}, did you mean ${closestMatches[0][1]}?`);
    }

    return null;
  }

  private async getEpisodesForShow(show: Show): Promise<Episode[]> {
    const url = `${this.buildConnectionString('episode')}&seriesId=${show.id}`;
    const axiosResponse = await axios.get<Episode[]>(url);
    return axiosResponse.data;
  }

  private async getShows(): Promise<Show[]> {
    // TODO: implement redis
    const axiosResponse = await axios.get<Show[]>(this.buildConnectionString('series'));
    return axiosResponse.data;
  }

  private async deleteEpisode(episode: { episodeFileId: number }) {
    let url = this.buildConnectionStringWithId('episodeFile', episode.episodeFileId);
    await axios.delete(url);
  }

  private async searchForEpisode(episodeId: number) {
    let url = this.buildConnectionString('command');

    return await axios.post(url, { name: 'EpisodeSearch', episodeIds: [episodeId] });
  }

  private zeroPad(input: number, length: number) {
    return (Array(length + 1).join('0') + input).slice(-length);
  }

  private async getActivityQueue(): Promise<QueueItem[]> {
    let url = this.buildConnectionString('queue');
    let axiosResponse = await axios.get<QueueItem[]>(url);
    return axiosResponse.data;
  }
}

interface Show {
  id: number;
  title: string;
}

interface Episode {
  id: number
  seriesId: number;
  episodeFileId: number;
  seasonNumber: number;
  episodeNumber: number;
}

interface QueueItem {
  series: Show;
  episode: Episode;
}

export enum RedownloadStatus {
  TRIGGERED_DOWNLOAD,
  CURRENTLY_DOWNLOADING
}
