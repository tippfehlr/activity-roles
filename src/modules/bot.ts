import Discord, { Intents } from 'discord.js';
import WOKcommands from 'wokcommands';
import path from 'path';

import * as db from './db';
import config from '../../config';

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

var processingUser: any = [];

client.on('ready', () => {
  new WOKcommands(client, {
    commandsDir: path.join(__dirname, '/commands'),
    testServers: config.testGuildIDs,
    typeScript: true,
    mongoUri: config.MONGODB_URI,
    botOwners: config.botOwners,
    disabledDefaultCommands: [
      // 'help',
      // 'command',
      'language',
      'prefix',
      // 'requiredrole'
    ],
  });

  client.user?.setPresence({
    status: 'online',
    afk: false,
    activities: config.activities
  });
});

client.on('presenceUpdate', async function (oldMember, newMember) {
  if (!newMember?.user || !newMember.guild || !newMember.member) return;
  if (newMember.user?.id in processingUser) return;
  processingUser[newMember.user?.id] = true;
  if (newMember.member.user.bot) return;
  await db.checkGuild(newMember.guild);
  await db.checkUser(newMember.user);

  for (const i in newMember.activities) {
    if (newMember.activities[i].name !== 'Custom Status') {
      db.UserData.findOne({ userID: newMember.user.id.toString(), activityName: newMember.activities[i].name }, (err: any, docs: any) => {
        if (err) console.error(err);
        if (!docs) {
          new db.UserData({
            userID: newMember.user?.id.toString(),
            activityName: newMember.activities[i].name,
            autoRole: true,
            ignored: false
          }).save();
          console.log(`\nMONGODB > New activity: ${newMember.user?.username} (${newMember.user?.id}) plays ${newMember.activities[i].name}.`);
        }
      }).lean();
    }
  }
  delete processingUser[newMember.user?.id];
  db.checkRoles(newMember.member);
});

client.on('guildCreate', function (guild) {
  console.log(`\nDISCORD.JS > the client joined ${guild.name}`);
  db.checkGuild(guild);
});

client.on('guildDelete', function (guild) {
  console.log(`\nthe client left ${guild.name}`);
});

client.on('disconnect', function (event) {
  console.log('\nDISCORD.JS > The WebSocket has closed and will no longer attempt to reconnect');
});

client.on('error', function (error) {
  console.error(`\nDISCORD.JS > The client's WebSocket encountered a connection error: ${error}`);
});

export function connect() {
  client.login(config.TOKEN);
}
