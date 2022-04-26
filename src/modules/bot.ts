import Discord, { Intents } from 'discord.js';
import WOKcommands from 'wokcommands';
import path from 'path';

import * as db from './db';
import config from '../../config';
import msg, { log } from './messages';

export const client = new Discord.Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_PRESENCES,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS
  ]
});

client.on('ready', () => {
  new WOKcommands(client, {
    commandsDir: path.join(__dirname, '/commands'),
    testServers: config.testGuildIDs,
    typeScript: true,
    mongoUri: config.MONGODB_URI,
    botOwners: config.botOwners,
    disabledDefaultCommands: [
      'help',
      'command',
      'language',
      'prefix',
      'requiredrole',
      'channelonly'
      // 'slash'
    ],
    logger: {
      log: (a: string) => log.info(a),
      warn: (a: string) => log.warn(a),
      error: (a: string) => log.error(a)
    }
  });

  client.user?.setPresence({
    status: 'online',
    afk: false,
    activities: config.activities
  });
  msg.log.login(
    String(client.user?.username),
    String(client.user?.discriminator),
    String(client.user?.id)
  );
  db.setGuildCheckInterval(client);
});

const processingUser = new Map<string, boolean>();
client.on('presenceUpdate', async (oldMember, newMember) => {
  if (!newMember?.user || !newMember.guild || !newMember.member) return;
  if (newMember.member.user.bot) return;
  if (processingUser.has(newMember.user?.id)) return;
  processingUser.set(newMember.user?.id, true);
  await db.checkGuild(newMember.guild);
  await db.checkUser(newMember.user);

  for (const activity of newMember.activities) {
    if (activity.name !== 'Custom Status') {
      const docs = await db.UserData.findOne({
        userID: newMember.user.id,
        activityName: activity.name
      }).lean();

      if (!docs) {
        new db.UserData({
          userID: newMember.user?.id,
          activityName: activity.name,
          autoRole: true,
          ignored: false
        }).save();
        msg.log.newActivity(
          newMember.user.username,
          newMember.user.id,
          newMember.guild.name,
          newMember.guild.id,
          activity.name
        );
      }
    }
  }
  processingUser.delete(newMember.user?.id);
  db.checkRoles(newMember.member);
});
//TODO: move to messages
client.on('guildCreate', guild => {
  console.log(`\nDISCORD.JS > the client joined ${guild.name}`);
  db.checkGuild(guild);
});

client.on('guildDelete', guild => {
  console.log(`\nthe client left ${guild.name}`);
});

client.on('disconnect', () => {
  console.log('\nDISCORD.JS > The WebSocket has closed and will no longer attempt to reconnect');
});

client.on('error', error => {
  console.error(`\nDISCORD.JS > The client's WebSocket encountered a connection error: ${error}`);
});

export function connect() {
  client.login(config.TOKEN);
}
