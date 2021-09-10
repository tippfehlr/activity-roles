import Discord, { Intents } from 'discord.js';
import WOKcommands from 'wokcommands';
import path from 'path';

export const client: Discord.Client = new Discord.Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_PRESENCES,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS
  ]
});

import UserConfig from './models/userConfig';
import GuildConfig from './models/guildConfig';
import GuildData from './models/guildData';
import UserData from './models/userData';
import * as db from './db';

import config from '../../config';

const testGuildIDs: string[] = ['782687651492790314', '727818725784551495'];

client.on('ready', () => {
  new WOKcommands(client, {
    commandsDir: path.join(__dirname, 'commands'),
    testServers: testGuildIDs,
    typescript: true,
    disabledDefaultCommands: [
      'help',
      'command',
      'language',
      'prefix',
      'requiredrole'
    ],
  });

  client.user?.setPresence({
    status: 'online',
    afk: false,
    activities: config.activities
  });

  console.log('DISCORD.JS > Ready!');
});

client.on('presenceUpdate', async function (oldMember: any, newMember: any) {
  if (newMember.member.user.bot) return;
  await db.checkGuild(newMember.guild);
  await db.checkUser(newMember.user);

  for (const i in newMember.activities) {
    if (newMember.activities[i].name !== 'Custom Status') {
      UserData.findOne({ userID: newMember.user.id.toString(), activityName: newMember.activities[i].name }, (err: any, docs: any) => {
        if (err) console.error(err);
        if (!docs) {
          new UserData({
            userID: newMember.user.id.toString(),
            activityName: newMember.activities[i].name,
            autoRole: true,
            ignored: false
          }).save();
          console.log(`\nMONGODB > New activity: ${newMember.user.username} (${newMember.user.id}) plays ${newMember.activities[i].name}.`);
        }
      }).lean();
    }
  }
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
