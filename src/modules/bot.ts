import { createHash } from 'crypto';
import Discord, { GatewayIntentBits } from 'discord.js';

import { db, getUserAutoRole, getActivityRoles } from './db';
import config from '../../config';
import { log } from './messages';
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
    activities: [config.activity]
  });
  log.info(
    `Logged in to Discord as ${client.user?.username}#${client.user?.discriminator} (${client.user?.id})`
  );
  log.info(
    `The bot is currently on ${client.guilds.cache.size} guilds with ${
      db.prepare('SELECT COUNT(*) FROM users').get()['COUNT(*)']
    } users`
  );
});

client.on('presenceUpdate', async (oldMember, newMember) => {
  const removedActivities = oldMember?.activities.filter(activity => {
    return !newMember?.activities.find(newActivity => newActivity.name === activity.name);
  });
  const addedActivities = newMember?.activities.filter(activity => {
    return !oldMember?.activities.find(oldActivity => oldActivity.name === activity.name);
  });
  if (
    config.presenceUpdateOnlyChanges &&
    removedActivities?.length === 0 &&
    addedActivities.length === 0
  )
    return;
  if (
    !newMember.user ||
    !newMember.guild ||
    newMember.member?.user.bot ||
    !getUserAutoRole(newMember.user?.id)
  ) {
    return;
  }
  await newMember.member?.fetch();
  const userIDHash = createHash('sha256').update(newMember.user.id).digest('base64');
  const activityRoles = getActivityRoles(newMember.guild.id);
  if (activityRoles.length === 0) return;
  const userActivities = newMember.activities.map(activity => activity.name);
  const currentlyActiveActivities: string[] = [];
  activityRoles
    .filter(activityRole => {
      if (activityRole.live) {
        if (
          userActivities.filter(userActivity =>
            activityRole.activityName.toLowerCase().includes(userActivity.toLowerCase())
          ).length > 0
        ) {
          return true;
        }
      } else {
        if (userActivities.includes(activityRole.activityName)) {
          return true;
        }
      }
    })
    .forEach(activityRole => {
      const role = newMember.guild?.roles.cache.get(activityRole.roleID);
      if (!role) {
        db.prepare('DELETE FROM activityRoles WHERE roleID = ?').run(activityRole.roleID);
        return;
      }
      if (activityRole.live) {
        currentlyActiveActivities.push(activityRole.activityName);
      }
      if (newMember.member?.roles.cache.has(role.id)) return;
      const highestBotRolePosition = newMember.guild?.members.me?.roles.highest.position;
      if (!highestBotRolePosition || highestBotRolePosition <= role.position) return;
      newMember.member?.roles.add(role);
      if (removedActivities?.length === 0 && addedActivities.length === 0)
        log.warn('the bot would have missed a role');
      if (activityRole.live) {
        db.prepare(
          'INSERT INTO currentlyActiveActivities (userID, guildID, activityName) VALUES (?, ?, ?)'
        ).run(userIDHash, newMember.guild?.id, activityRole.activityName);
      }
    });

  const res = db
    .prepare(
      'SELECT * FROM currentlyActiveActivities LEFT JOIN activityRoles ON activityRoles.activityName = currentlyActiveActivities.activityName WHERE currentlyActiveActivities.userID = ? AND currentlyActiveActivities.guildID = ?'
    )
    .all(userIDHash, newMember.guild.id);
  res.forEach(activityRole => {
    if (!currentlyActiveActivities.includes(activityRole.activityName)) {
      const role = newMember.guild?.roles.cache.get(activityRole.roleID);
      if (!role || !newMember.member?.roles.cache.has(role.id)) {
        db.prepare(
          'DELETE FROM currentlyActiveActivities WHERE userID = ? AND activityName = ?'
        ).run(userIDHash, activityRole.activityName);
      } else {
        newMember.member?.roles.remove(role);
        if (removedActivities?.length === 0 && addedActivities.length === 0)
          log.warn('the bot would have missed a role');
        db.prepare(
          'DELETE FROM currentlyActiveActivities WHERE userID = ? AND activityName = ?'
        ).run(userIDHash, activityRole.activityName);
      }
    }
  });
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
  db.prepare('DELETE FROM activityRoles WHERE roleID = ? AND guildID = ?').run(
    role.id,
    role.guild.id
  );
});

export function connect() {
  return client.login(config.TOKEN);
}
