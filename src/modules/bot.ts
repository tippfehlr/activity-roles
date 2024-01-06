import { createHash } from 'crypto';
import Discord, { ActivityType, Events, GatewayIntentBits, PermissionsBitField } from 'discord.js';

import {
  DBActiveTemporaryRoles,
  DBCurrentlyActiveActivity,
  addActivity,
  db,
  getActivityRoles,
  getGuildConfig,
  getStatusRoles,
  getUserConfig
} from './db';
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
            count: (db.prepare('SELECT COUNT(*) FROM users').get() as { 'COUNT(*)': number })[
              'COUNT(*)'
            ]
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
            count:
              (
                db.prepare('SELECT COUNT(*) FROM activityRoles').get() as {
                  'COUNT(*)': number;
                }
              )['COUNT(*)'] +
              (
                db.prepare('SELECT COUNT(*) FROM statusRoles').get() as {
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
    `Logged in as ${client.user?.username}#${client.user?.discriminator} (${client.user?.id})`
  );
  log.info(
    `The bot is currently on ${client.guilds.cache.size} guilds with ${(db.prepare('SELECT COUNT(*) FROM users').get() as { 'COUNT(*)': number })['COUNT(*)']
    } users and manages ${(db.prepare('SELECT COUNT(*) FROM activityRoles').get() as { 'COUNT(*)': number })['COUNT(*)']
    } roles`
  );

  const activityCountInCurrentlyActiveActivities = (
    db.prepare('SELECT COUNT(*) FROM currentlyActiveActivities').get() as any
  )['COUNT(*)'];
  if (activityCountInCurrentlyActiveActivities > 0) {
    log.info(
      `There are still ${activityCountInCurrentlyActiveActivities} activites in currentlyActiveActivites left.`
    );
  } else {
    log.info(
      'There are no activites in currentlyActiveActivites left and it can safely be deleted :)'
    );
  }
});

client.on(Events.PresenceUpdate, async (oldMember, newMember) => {
  if (!newMember.guild) return;
  const guildID = newMember.guild.id;
  if (!newMember.guild.members.me?.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
    log.warn(
      `MISSING ACCESS: Guild: ${newMember.guild.name} (ID: ${guildID}, OwnerID: ${newMember.guild.ownerId}), Permission: MANAGE_ROLES`
    );
    return;
  }
  if (!newMember.user || !newMember.guild || newMember.member?.user.bot) return;

  const userConfig = getUserConfig(newMember.userId);
  if (!userConfig.autoRole) return;

  const highestBotRolePosition = newMember.guild.members.me?.roles.highest.position;
  const userIDHash = createHash('sha256').update(newMember.user.id).digest('base64');
  const guildConfig = getGuildConfig(guildID);
  await newMember.member?.fetch();

  if (
    guildConfig.requiredRoleID !== null &&
    newMember.member?.roles.cache.has(guildConfig.requiredRoleID)
  ) {
    return;
  }

  const addedActivities = newMember?.activities.filter(activity => {
    return !oldMember?.activities.find(oldActivity => oldActivity.name === activity.name);
  });

  for (const activity of addedActivities) {
    if (activity.name !== 'Custom Status') addActivity(guildID, activity.name);
  }

  const statusRoles = getStatusRoles(guildID);
  const activityRoles = getActivityRoles(guildID);
  const activeTemporaryRoles = db
    .prepare('SELECT * FROM activeTemporaryRoles WHERE userIDHash = ? AND guildID = ?')
    .all(userIDHash, guildID) as DBActiveTemporaryRoles[];

  if (statusRoles.length === 0 && activityRoles.length === 0 && activeTemporaryRoles.length === 0) {
    return;
  }

  const permanentRoleIDsToBeAdded: Set<string> = new Set();
  const tempRoleIDsToBeAdded: Set<string> = new Set();
  const addRole = ({ roleID, permanent }: { roleID: string, permanent: boolean }) => {
    if (permanent) {
      permanentRoleIDsToBeAdded.add(roleID);
    } else {
      tempRoleIDsToBeAdded.add(roleID);
    }
  };

  // ------------ status roles ------------
  const states: Set<ActivityType> = new Set();
  for (const activity of newMember.activities) {
    states.add(activity.type);
  }
  statusRoles.forEach(statusRole => {
    if (states.has(statusRole.type)) addRole({ roleID: statusRole.roleID, permanent: false });
  });

  // ------------ activity roles ------------
  const userActivities = newMember.activities.map(activity => activity.name);

  activityRoles.forEach(activityRole => {
    if (
      // exactActivityName
      (activityRole.exactActivityName && userActivities.includes(activityRole.activityName)) ||
      // not exactActivityName
      (!activityRole.exactActivityName &&
        userActivities.find(userActivity =>
          userActivity.toLowerCase().includes(activityRole.activityName.toLowerCase())
        ))
    ) {
      addRole({ roleID: activityRole.roleID, permanent: !activityRole.live });
    }
  });

  // ------------ “apply changes” ------------
  const addDiscordRoleToMember = ({ roleID, permanent }: { roleID: string, permanent: boolean }) => {
    const role = newMember.guild?.roles.cache.get(roleID);
    if (!role) {
      db.prepare('DELETE FROM statusRoles WHERE guildID = ? AND roleID = ?').run(
        newMember.guild?.id,
        roleID
      );
      db.prepare('DELETE FROM activityRoles WHERE guildID = ? AND roleID = ?').run(guildID, roleID);
      return;
    }
    if (!highestBotRolePosition || highestBotRolePosition <= role.position) return;
    if (newMember.member?.roles.cache.has(role.id)) return;
    if (!permanent) {
      db.prepare(
        'INSERT OR IGNORE INTO activeTemporaryRoles (userIDHash, guildID, roleID) VALUES (?, ?, ?)'
      ).run(userIDHash, guildID, roleID);
    }
    newMember.member?.roles.add(role);
  };
  permanentRoleIDsToBeAdded.forEach(roleID => {
    addDiscordRoleToMember({ roleID, permanent: true });
  });
  tempRoleIDsToBeAdded.forEach(roleID => {
    addDiscordRoleToMember({ roleID, permanent: false });
  });

  // remove temporary roles --- new activeTemporaryRoles
  activeTemporaryRoles.forEach(activeTemporaryRole => {
    if (!tempRoleIDsToBeAdded.has(activeTemporaryRole.roleID)) {
      const role = newMember.guild?.roles.cache.get(activeTemporaryRole.roleID);
      if (role) newMember.member?.roles.remove(role);
      db.prepare(
        'DELETE FROM activeTemporaryRoles WHERE guildID = ? AND userIDHash = ? AND roleID = ?'
      ).run(newMember.guild?.id, userIDHash, activeTemporaryRole.roleID);
    }
  });

  // remove temporary activites that no longer apply --- @deprecated: phase out currentlyActiveActivities and use activeTemporaryRoles
  (
    db
      .prepare('SELECT * FROM currentlyActiveActivities WHERE userIDHash = ? AND guildID = ?')
      .all(userIDHash, guildID) as DBCurrentlyActiveActivity[]
  ).forEach(activeActivity => {
    activityRoles
      .filter(activityRole => activityRole.activityName === activeActivity.activityName)
      .map(activityRole => activityRole.roleID)
      .forEach(roleID => {
        if (permanentRoleIDsToBeAdded.has(roleID)) {
          db.prepare(
            'INSERT OR IGNORE INTO aciveTemporaryRoles (userIDHash, guildID, roleID) VALUES (?, ?, ?)'
          ).run(userIDHash, guildID, roleID);
        } else {
          const role = newMember.guild?.roles.cache.get(roleID);
          if (role && newMember.member?.roles.cache.has(role.id)) {
            newMember.member?.roles.remove(role);
          }
        }
        db.prepare(
          'DELETE FROM currentlyActiveActivities WHERE userIDHash = ? AND guildID = ? AND activityName = ?'
        ).run(userIDHash, guildID, activeActivity.activityName);
      });
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
