import { createHash } from 'crypto';
import Discord, { ActivityType, Events, GatewayIntentBits, PermissionsBitField } from 'discord.js';

import { addActivity, db, getActivityRoles, getGuildConfig, getUserConfig } from './db';
import config from './config';
import { i18n, log } from './messages';
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

client.on(Events.ClientReady, () => {
  commandHandler = new CommandHandler(client);
  const setActivityGuilds = () => {
    client.user?.setPresence({
      status: 'online',
      afk: false,
      activities: [
        {
          name: i18n.__n({
            singular: '%s guild',
            plural: '%s guilds',
            locale: 'en-US',
            count: client.guilds.cache.size
          }),
          type: ActivityType.Watching
        }
      ]
    });
    setTimeout(setActivityUsers, 10 * 1000);
  };
  const setActivityUsers = () => {
    client.user?.setPresence({
      activities: [
        {
          name: i18n.__n({
            singular: '%s user',
            plural: '%s users',
            locale: 'en-US',
            count: (
              db.prepare('SELECT COUNT(*) FROM users').get() as {
                'COUNT(*)': number;
              }
            )['COUNT(*)']
          }),
          type: ActivityType.Watching
        }
      ]
    });
    setTimeout(setActivityActivityRoles, 10 * 1000);
  };
  const setActivityActivityRoles = () => {
    client.user?.setPresence({
      activities: [
        {
          name: i18n.__n({
            singular: '%s role',
            plural: '%s roles',
            locale: 'en-US',
            count: (
              db.prepare('SELECT COUNT(*) FROM activityRoles').get() as {
                'COUNT(*)': number;
              }
            )['COUNT(*)']
          }),
          type: ActivityType.Watching
        }
      ]
    });
    setTimeout(setActivityGuilds, 10 * 1000);
  };
  setActivityGuilds();

  log.info(
    `Logged in to Discord as ${client.user?.username}#${client.user?.discriminator} (${client.user?.id})`
  );
  log.info(
    `The bot is currently on ${client.guilds.cache.size} guilds with ${(db.prepare('SELECT COUNT(*) FROM users').get() as { 'COUNT(*)': number })['COUNT(*)']
    } users`
  );
});

client.on(Events.PresenceUpdate, async (oldMember, newMember) => {
  if (!newMember.guild?.members.me?.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
    log.warn(
      `MISSING ACCESS: Guild: ${newMember.guild?.name} (ID: ${newMember.guild?.id}, OwnerID: ${newMember.guild?.ownerId}), Permission: MANAGE_ROLES`
    );
    return;
  }
  if (!newMember.user || !newMember.guild || newMember.member?.user.bot) return;
  const userConfig = getUserConfig(newMember.userId);
  if (!userConfig.autoRole) return;
  const addedActivities = newMember?.activities.filter(activity => {
    return !oldMember?.activities.find(oldActivity => oldActivity.name === activity.name);
  });
  for (const activity of addedActivities) {
    addActivity(newMember.guild.id, activity.name);
  }
  const guildConfig = getGuildConfig(newMember.guild.id);
  await newMember.member?.fetch();
  const highestBotRolePosition = newMember.guild?.members.me?.roles.highest.position;
  const userIDHash = createHash('sha256').update(newMember.user.id).digest('base64');
  const activityRoles = getActivityRoles(newMember.guild.id);
  if (activityRoles.length === 0) return;
  const userActivities = newMember.activities.map(activity => activity.name);
  const currentlyActiveActivities: string[] = [];
  activityRoles
    .filter(activityRole => {
      if (activityRole.exactActivityName) {
        if (userActivities.includes(activityRole.activityName)) {
          return true;
        }
      } else {
        if (
          userActivities.find(userActivity =>
            userActivity.toLowerCase().includes(activityRole.activityName.toLowerCase())
          )
        ) {
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
      if (!highestBotRolePosition || highestBotRolePosition <= role.position) return;
      //check for required role
      if (
        guildConfig.requiredRoleID === null ||
        newMember.member?.roles.cache.has(guildConfig.requiredRoleID)
      ) {
        newMember.member?.roles.add(role);
      }
      if (activityRole.live) {
        db.prepare(
          'INSERT OR IGNORE INTO currentlyActiveActivities (userIDHash, guildID, activityName) VALUES (?, ?, ?)'
        ).run(userIDHash, newMember.guild?.id, activityRole.activityName);
      }
    });

  const res = db
    .prepare(
      'SELECT * FROM currentlyActiveActivities LEFT JOIN activityRoles ON activityRoles.activityName = currentlyActiveActivities.activityName WHERE currentlyActiveActivities.userIDHash = ? AND currentlyActiveActivities.guildID = ?'
    )
    .all(userIDHash, newMember.guild.id);
  res.forEach((activityRole: any) => {
    if (!currentlyActiveActivities.includes(activityRole.activityName)) {
      const role = newMember.guild?.roles.cache.get(activityRole.roleID);
      if (!role || !newMember.member?.roles.cache.has(role.id)) {
        db.prepare(
          'DELETE FROM currentlyActiveActivities WHERE userIDHash = ? AND activityName = ?'
        ).run(userIDHash, activityRole.activityName);
      } else {
        newMember.member?.roles.remove(role);
        db.prepare(
          'DELETE FROM currentlyActiveActivities WHERE userIDHash = ? AND activityName = ?'
        ).run(userIDHash, activityRole.activityName);
      }
    }
  });
});

client.on(Events.GuildCreate, guild => {
  log.info(`Joined guild ${guild.name} (${guild.id})`);
  getGuildConfig(guild.id);
});

client.on(Events.GuildDelete, guild => log.info(`Left guild ${guild.name} (${guild.id})`));

client.on(Events.Error, error =>
  log.error(error, 'The Discord WebSocket has encountered an error')
);

client.on(Events.GuildRoleDelete, async role => {
  db.prepare('DELETE FROM activityRoles WHERE roleID = ? AND guildID = ?').run(
    role.id,
    role.guild.id
  );
});

export function connect() {
  return client.login(config.TOKEN);
}
