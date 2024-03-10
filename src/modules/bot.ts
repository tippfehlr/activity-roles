import { createHash } from 'crypto';
import Discord, { ActivityType, Events, GatewayIntentBits, Options, PermissionsBitField } from 'discord.js';

import {
  DBActiveTemporaryRoles,
  DBCurrentlyActiveActivity,
  addActivity,
  getActivityRoles,
  getDBUserCount,
  getGuildConfig,
  getRolesCount,
  getStatusRoles,
  getUserConfig,
  prepare
} from './db';
import config from './config';
import { i18n, log } from './messages';
import CommandHandler from './commandHandler';
import { configureInfluxDB } from './metrics';

export const client = new Discord.Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildPresences,
  ],
  shards: 'auto',
  makeCache: Options.cacheWithLimits({
    ...Options.DefaultMakeCacheSettings,
    MessageManager: 0,
    // UserManager: {
    //   maxSize: 25000,
    //   keepOverLimit: user => user.id === user.client.user.id,
    // },
    // GuildMemberManager: {
    //   maxSize: 5000,
    //   keepOverLimit: member => member.id === member.client.user.id,
    // },
    // PresenceManager: 50000,
  }),
  sweepers: {
    ...Options.DefaultSweeperSettings,
    users: {
      interval: 30 * 60, // 30 minutes
      filter: () => user => user.id !== user.client.user.id, // don’t remove the client’s user
    },
    guildMembers: {
      interval: 30 * 60,
      filter: () => member => member.id !== member.client.user.id,
    },
    presences: {
      interval: 30 * 60,
      filter: () => () => true, // remove all presences
    },
  },
});

export let commandHandler: CommandHandler;


export const stats = {
  presenceUpdates: 0,
  missingAccess: 0,
  rolesAdded: 0,
  rolesRemoved: 0,
  webSocketErrors: 0
};
export function resetStats() {
  stats.presenceUpdates = 0;
  stats.missingAccess = 0;
  stats.rolesAdded = 0;
  stats.rolesRemoved = 0;
  stats.webSocketErrors = 0;
}

client.on(Events.ClientReady, () => {
  configureInfluxDB();
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
            count: getDBUserCount()
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
            count: getRolesCount()
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
    `The bot is currently on ${client.guilds.cache.size} guilds with ${getDBUserCount()} users and manages ${getRolesCount()} roles`
  );

  const activityCountInCurrentlyActiveActivities = (
    prepare('SELECT COUNT(*) FROM currentlyActiveActivities').get() as any
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
  stats.presenceUpdates++;
  if (!newMember.guild) return;
  const guildID = newMember.guild.id;
  if (!newMember.guild.members.me?.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
    stats.missingAccess++;
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
  const activeTemporaryRoles =
    prepare('SELECT * FROM activeTemporaryRoles WHERE userIDHash = ? AND guildID = ?')
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
      prepare('DELETE FROM statusRoles WHERE guildID = ? AND roleID = ?').run(
        newMember.guild?.id,
        roleID
      );
      prepare('DELETE FROM activityRoles WHERE guildID = ? AND roleID = ?').run(guildID, roleID);
      return;
    }
    if (!highestBotRolePosition || highestBotRolePosition <= role.position) return;
    if (newMember.member?.roles.cache.has(role.id)) return;
    if (!permanent) {
      prepare(
        'INSERT OR IGNORE INTO activeTemporaryRoles (userIDHash, guildID, roleID) VALUES (?, ?, ?)'
      ).run(userIDHash, guildID, roleID);
    }
    newMember.member?.roles.add(role);
    stats.rolesAdded++;
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
      prepare(
        'DELETE FROM activeTemporaryRoles WHERE guildID = ? AND userIDHash = ? AND roleID = ?'
      ).run(newMember.guild?.id, userIDHash, activeTemporaryRole.roleID);
      stats.rolesRemoved++;
    }
  });

  // @deprecated remove all roles still in currentlyActiveActivities
  (

    prepare('SELECT * FROM currentlyActiveActivities WHERE userIDHash = ? AND guildID = ?')
      .all(userIDHash, guildID) as DBCurrentlyActiveActivity[]
  ).forEach(activeActivity => {
    activityRoles
      .map(activityRole => activityRole.roleID)
      .forEach(roleID => {
        const role = newMember.guild?.roles.cache.get(roleID);
        if (role && newMember.member?.roles.cache.has(role.id)) {
          newMember.member?.roles.remove(role);
        }
        prepare(
          'DELETE FROM currentlyActiveActivities WHERE userIDHash = ? AND guildID = ? AND activityName = ?'
        ).run(userIDHash, guildID, activeActivity.activityName);
        stats.rolesRemoved++;
      });
  });
});

client.on(Events.GuildCreate, guild => {
  log.info(`Joined guild ${guild.name} (${guild.id})`);
  getGuildConfig(guild.id);
});

client.on(Events.GuildDelete, guild => log.info(`Left guild ${guild.name} (${guild.id})`));

client.on(Events.Error, error => {
  log.error(error, 'The Discord WebSocket has encountered an error')
  stats.webSocketErrors++;
});

client.on(Events.GuildRoleDelete, async role => {
  prepare('DELETE FROM activityRoles WHERE roleID = ? AND guildID = ?').run(
    role.id,
    role.guild.id
  );
});

export function connect() {
  return client.login(config.TOKEN);
}
