import Discord, { Intents } from 'discord.js';
import WOKcommands from 'wokcommands';
import path from 'path';

import * as db from './db';
import config from '../../config';
import msg from './messages';

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
    ]
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
});

const processingUser = new Map<string, boolean>();
client.on('presenceUpdate', async function (oldMember, newMember) {
  if (!newMember?.user || !newMember.guild || !newMember.member) return;
  if (newMember.member.user.bot) return;
  if (processingUser.has(newMember.user?.id)) return;
  processingUser.set(newMember.user?.id, true);
  await db.checkGuild(newMember.guild);
  await db.checkUser(newMember.user);

  for (const i in newMember.activities) {
    if (newMember.activities[i].name !== 'Custom Status') {
      const docs = await db.UserData.findOne({
        userID: newMember.user.id,
        activityName: newMember.activities[i].name
      }).lean();

      if (!docs) {
        new db.UserData({
          userID: newMember.user?.id,
          activityName: newMember.activities[i].name,
          autoRole: true,
          ignored: false
        }).save();
        console.log(
          `\nMONGODB > New activity: ${newMember.user?.username} (${newMember.user?.id}) plays ${newMember.activities[i].name}.`
        );
      }
    }
  }
  processingUser.delete(newMember.user?.id);
  db.checkRoles(newMember.member);
});

client.on('guildCreate', function (guild) {
  console.log(`\nDISCORD.JS > the client joined ${guild.name}`);
  db.checkGuild(guild);
});

client.on('guildDelete', function (guild) {
  console.log(`\nthe client left ${guild.name}`);
});

client.on('disconnect', function () {
  console.log('\nDISCORD.JS > The WebSocket has closed and will no longer attempt to reconnect');
});

client.on('error', function (error) {
  console.error(`\nDISCORD.JS > The client's WebSocket encountered a connection error: ${error}`);
});

export function connect() {
  client.login(config.TOKEN);
}
