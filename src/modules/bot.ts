import Discord, { GatewayIntentBits } from 'discord.js';

import { db, setGuildCheckInterval, checkUser, checkRoles } from './db';
import config from '../../config';
import msg, { log } from './messages';
import CommandHandler from './commandHandler';

export const client = new Discord.Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages
  ]
});

export let commandHandler: CommandHandler;

client.on('ready', () => {
  commandHandler = new CommandHandler(client);
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
  setGuildCheckInterval(client);
});

const processingUser = new Map<string, boolean>();
client.on('presenceUpdate', async (oldMember, newMember) => {
  await newMember.member?.fetch(); // is it necessary to fetch the whole member?
  if (!newMember?.user || !newMember.guild || !newMember.member) return;
  if (processingUser.has(newMember.user?.id)) return;
  if (newMember.member.user.bot) return;
  processingUser.set(newMember.user?.id, true);

  await checkUser(newMember.user);

  for (const activity of newMember.activities) {
    if (activity.name !== 'Custom Status') {
      if (
        !db
          .prepare('SELECT * FROM userData WHERE userID = ? AND activityName = ?')
          .get(newMember.user.id, activity.name)
      ) {
        db.prepare('INSERT INTO userData VALUES (?, ?, ?)').run(
          newMember.user.id,
          activity.name,
          1
        );
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
  await checkRoles(newMember.member);
  processingUser.delete(newMember.user?.id);
});

client.on('guildCreate', guild => {
  log.info(`Joined guild ${guild.name} (${guild.id})`);
});

client.on('guildDelete', guild => log.info(`Left guild ${guild.name} (${guild.id})`));

client.on('disconnect', () => {
  log.warn('The Discord WebSocket has closed and will no longer attempt to reconnect');
});

client.on('error', error => log.error(error, 'The Discord WebSocket has encountered an error'));

client.on('roleDelete', async role => {
  db.prepare('DELETE FROM guildData WHERE roleID = ? AND guildID = ?').run(role.id, role.guild.id);
});

export function connect() {
  return client.login(config.TOKEN);
}
