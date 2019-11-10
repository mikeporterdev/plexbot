import client from './discord';
import { Message } from 'discord.js';
import { RedownloadStatus } from './sonarr';
import { redownloadTV } from './plexbot-actions';
import SonarrError from './exceptions/SonarrError';

client.on('ready', () => {
  console.log(`logged in as ${client.user.tag}`);
});

client.on('message', async (msg: Message) => {
  if (msg.author.bot) {
    // Don't respond to other bots
    return;
  }

  let content = msg.content.trim();
  if (!content.startsWith('plexbot')) {
    // Not for us, lets bail
    return;
  }

  let redownloadCommand = 'plexbot redownload';
  if (content.startsWith(redownloadCommand)) {
    // Lets go boi
    let args = content.substring(redownloadCommand.length).split(',').map(i => i.trim());

    if (args.length === 0) {
      await didNotUnderstandArgs(msg);
      return;
    }

    let mediaType = args[0];
    if (mediaType !== 'movie' && mediaType !== 'show') {
      await didNotUnderstandArgs(msg);
      return;
    }

    try {
      if (mediaType == 'movie') {
        msg.reply('I can\'t handle movies yet!');
      }

      if (mediaType === 'show') {
        if (args.length != 3) {
          await didNotUnderstandArgs(msg);
          return;
        }

        console.log('triggering download');
        let redownloadStatus = await redownloadTV(args[1], args[2]);

        if (redownloadStatus === RedownloadStatus.TRIGGERED_DOWNLOAD) {
          msg.reply(`I triggered a download for ${args[1]} - ${args[2]}`);
        } else if (redownloadStatus === RedownloadStatus.CURRENTLY_DOWNLOADING) {
          msg.reply(`I'm in the middle of downloading ${args[1]} - ${args[2]}`);
        }
      }

    } catch (e) {
      if (e instanceof SonarrError) {
        await msg.reply(e.message);
      } else {
        console.error(e);
      }
    }


  }

});

async function didNotUnderstandArgs(msg: Message) {
  await msg.reply(`I don't understand your command, try plexbot redownload,show,<showName>,<episodeNumber>`);
  await msg.reply('The commas are important!');
}
