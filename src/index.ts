import client from './discord';
import { Message } from 'discord.js';
import { redownloadTV } from './plexbot-actions';
import PlexbotError from './exceptions/PlexbotError';
import { RedownloadStatus } from './types/types';

const redownloadCommand = 'plexbot redownload';

client.on('ready', () => {
  console.log(`logged in as ${client.user.tag}`);
});

async function didNotUnderstandArgs(msg: Message): Promise<void> {
  await msg.reply(`I don't understand your command, try plexbot redownload show,<showName>,<episodeNumber>`);
  await msg.reply('The commas are important!');
}

async function redownload(msg: Message, content: string): Promise<void> {
  const args = content
    .substring(redownloadCommand.length)
    .split(',')
    .map(i => i.trim());

  if (args.length === 0) {
    await didNotUnderstandArgs(msg);
    return;
  }

  const mediaType = args[0];
  if (mediaType !== 'movie' && mediaType !== 'show') {
    await didNotUnderstandArgs(msg);
    return;
  }

  try {
    if (mediaType == 'movie') {
      await msg.reply(`I can't handle movies yet!`);
      return;
    }

    if (mediaType === 'show') {
      if (args.length != 3) {
        await didNotUnderstandArgs(msg);
        return;
      }

      console.log('triggering download');
      const redownloadStatus = await redownloadTV(args[1], args[2]);

      if (redownloadStatus === RedownloadStatus.TRIGGERED_DOWNLOAD) {
        msg.reply(`I triggered a download for ${args[1]} - ${args[2]}`);
      } else if (redownloadStatus === RedownloadStatus.CURRENTLY_DOWNLOADING) {
        msg.reply(`I'm in the middle of downloading ${args[1]} - ${args[2]}`);
      }
    }
  } catch (e) {
    if (e instanceof PlexbotError) {
      await msg.reply(e.message);
    } else {
      await msg.reply('Something went wrong :(');
      console.error(e);
    }
  }
}

client.on('message', async (msg: Message) => {
  if (msg.author.bot) {
    // Don't respond to other bots
    return;
  }

  const content = msg.content.trim();
  if (!content.startsWith('plexbot')) {
    // Not for us, lets bail
    return;
  }

  if (content.startsWith(redownloadCommand)) {
    await redownload(msg, content);
  }

  if (content.startsWith('plexbot help')) {
    await msg.reply('Try plexbot redownload show,<showName>,<episodeNumber>');
  }
});
