import { createHash } from 'crypto';
import Discord, {
  ActivityType,
  Events,
  GatewayIntentBits,
  Options,
  PermissionsBitField,
} from 'discord.js';

import {
  DBActiveTemporaryRoles,
  DBCurrentlyActiveActivity,
  addActivity,
  getActivityRoles,
  getUserCount,
  getGuildConfig,
  getRolesCount,
  getStatusRoles,
  getUserConfig,
  prepare,
  DBStatusRole,
  DBActivityRole,
  hashUserID,
} from './db';
import config from './config';
import { i18n, log } from './messages';
import CommandHandler from './commandHandler';
import { configureInfluxDB, writeIntPoint } from './metrics';

export const client = new Discord.Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMembers,
  ],
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
    // users: {
    //   interval: 60 * 60, // in seconds, 1 hour
    //   filter: () => user => user.id !== user.client.user.id, // don’t remove the client’s user
    // },
    // guildMembers: {
    //   interval: 60 * 60,
    //   filter: () => member => member.id !== member.client.user.id,
    // },
    // presences: {
    //   interval: 60 * 60,
    //   filter: () => () => true, // remove all presences
    // },
  },
});

export let commandHandler: CommandHandler;

export const stats = {
  presenceUpdates: 0,
  rolesAdded: 0,
  rolesRemoved: 0,
  webSocketErrors: 0,
};
export function resetStats() {
  stats.presenceUpdates = 0;
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
            count: client.guilds.cache.size,
          }),
          type: ActivityType.Watching,
        },
      ],
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
            count: getUserCount(),
          }),
          type: ActivityType.Watching,
        },
      ],
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
            count: getRolesCount(),
          }),
          type: ActivityType.Watching,
        },
      ],
    });
    setTimeout(setActivityGuilds, 10 * 1000);
  };
  setActivityGuilds();

  log.info(
    `Logged in as ${client.user?.username}#${client.user?.discriminator} (${client.user?.id})`,
  );
  log.info(
    `The bot is currently on ${client.guilds.cache.size} guilds with ${getUserCount()} users and manages ${getRolesCount()} roles`,
  );

  const activityCountInCurrentlyActiveActivities = (
    prepare('SELECT COUNT(*) FROM currentlyActiveActivities').get() as any
  )['COUNT(*)'];
  if (activityCountInCurrentlyActiveActivities > 0) {
    log.info(
      `There are still ${activityCountInCurrentlyActiveActivities} activites in currentlyActiveActivites left.`,
    );
  } else {
    log.info(
      'There are no activites in currentlyActiveActivites left and it can safely be deleted :)',
    );
  }
});

// PresenceUpdate fires once for every guild the bot shares with the user
client.on(Events.PresenceUpdate, async (oldMember, newMember) => {
  const startTime = Date.now();
  stats.presenceUpdates++;

  let debug = false;
  if (newMember.userId === '712702707986595880' && newMember.guild?.id === '226115726509998090') {
    debug = true;
  }

  // no activities changed
  // if (oldMember?.activities.toString() === newMember?.activities.toString()) return;

  if (!newMember.guild) return;
  const guildID = newMember.guild.id;
  if (!newMember.guild.members.me?.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
    await newMember.guild.leave();
    log.warn(
      `MISSING ACCESS: LEFT guild: ${newMember.guild.name} (ID: ${guildID}, OwnerID: ${newMember.guild.ownerId}), Permission: MANAGE_ROLES`,
    );
    return;
  }
  if (!newMember.user || !newMember.guild || newMember.member?.user.bot) return;

  const userConfig = getUserConfig(newMember.userId);
  if (!userConfig.autoRole) return;

  const userIDHash = createHash('sha256').update(newMember.user.id).digest('base64');
  const guildConfig = getGuildConfig(guildID);
  // if (debug) console.time('fetch member');
  // await newMember.member?.fetch(true);
  // if (debug) console.timeEnd('fetch member');

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
  const activeTemporaryRoles = prepare(
    'SELECT * FROM activeTemporaryRoles WHERE userIDHash = ? AND guildID = ?',
  ).all(userIDHash, guildID) as DBActiveTemporaryRoles[];

  // return if guild doesn’t have any roles
  if (statusRoles.length === 0 && activityRoles.length === 0 && activeTemporaryRoles.length === 0) {
    return;
  }
  if (!newMember.member) return;
  await processRoles({
    memberStatus: newMember.status,
    statusRoles,
    activities: newMember.activities,
    activityRoles,
    guild: newMember.guild,
    member: newMember.member,
    activeTemporaryRoles,
  });

  writeIntPoint('presence_updates', 'took_time', Date.now() - startTime);
});

export async function processRoles({
  memberStatus,
  statusRoles,
  activities,
  activityRoles,
  activeTemporaryRoles,
  guild,
  member,
}: {
  memberStatus: Discord.PresenceStatus;
  statusRoles: DBStatusRole[];
  activities: Discord.Activity[];
  activityRoles: DBActivityRole[];
  guild: Discord.Guild;
  member: Discord.GuildMember;
  activeTemporaryRoles: DBActiveTemporaryRoles[];
}) {
  const permanentRoleIDsToBeAdded: Set<string> = new Set();
  const tempRoleIDsToBeAdded: Set<string> = new Set();
  const userIDHash = hashUserID(member.id);

  const highestBotRolePosition = guild.members.me?.roles.highest.position;
  const addDiscordRoleToMember = async ({
    add,
    roleID,
    permanent,
    userIDHash,
  }: {
    add: boolean;
    roleID: string;
    permanent?: boolean;
    userIDHash: string;
  }) => {
    const role = guild.roles.cache.get(roleID);
    if (!role) {
      prepare('DELETE FROM statusRoles WHERE guildID = ? AND roleID = ?').run(guild.id, roleID);
      prepare('DELETE FROM activityRoles WHERE guildID = ? AND roleID = ?').run(guild.id, roleID);
      prepare('DELETE FROM activeTemporaryRoles WHERE guildID = ? AND roleID = ?').run(
        guild.id,
        roleID,
      );
      log.warn(`Role ${roleID} not found in guild ${guild.id} and was deleted from the database`);
      return;
    }
    if (!highestBotRolePosition || highestBotRolePosition <= role.position) {
      log.warn(
        `Role ${role.name} is higher than the bot’s highest role and was skipped (in guild ${guild.name})`,
      );
      return;
    }

    if (add) {
      // does the cache need to be checked?
      if (member.roles.cache.has(role.id)) {
        log.warn(
          `${member.displayName} (${member.user.username}) already has the role ${role.name} in guild ${guild.name} (${guild.id})`,
        );
        return;
      }
      if (permanent) {
        writeIntPoint('roles_added', 'permanent_roles_added', 1);
      } else {
        writeIntPoint('roles_added', 'temporary_roles_added', 1);
        prepare(
          'INSERT OR IGNORE INTO activeTemporaryRoles (userIDHash, guildID, roleID) VALUES (?, ?, ?)',
        ).run(userIDHash, guild.id, roleID);
      }
      await member.roles.add(role);
      stats.rolesAdded++;
    } else {
      // does the cache need to be checked?
      if (!member.roles.cache.has(role.id)) {
        log.warn(
          `can’t remove the role: ${member.displayName} (${member.user.username}) doesn’t have the role ${role.name} in guild ${guild.name} (${guild.id})`,
        );
        return;
      }
      await member.roles.remove(role);
      stats.rolesRemoved++;

      prepare(
        'DELETE FROM activeTemporaryRoles WHERE guildID = ? AND userIDHash = ? AND roleID = ?',
      ).run(guild.id, userIDHash, roleID);
    }
  };

  // if user is offline, skip checking for added activities
  if (memberStatus !== 'offline') {
    const addRole = ({ roleID, permanent }: { roleID: string; permanent: boolean }) => {
      if (permanent) {
        permanentRoleIDsToBeAdded.add(roleID);
      } else {
        tempRoleIDsToBeAdded.add(roleID);
      }
    };

    // ------------ status roles ------------
    const states: Set<ActivityType> = new Set();
    for (const activity of activities) {
      states.add(activity.type);
    }
    statusRoles.forEach(statusRole => {
      if (states.has(statusRole.type)) addRole({ roleID: statusRole.roleID, permanent: false });
    });

    // ------------ activity roles ------------
    const userActivities = activities.map(activity => activity.name);

    activityRoles.forEach(activityRole => {
      if (
        // exactActivityName
        (activityRole.exactActivityName && userActivities.includes(activityRole.activityName)) ||
        // not exactActivityName
        (!activityRole.exactActivityName &&
          userActivities.find(userActivity =>
            userActivity.toLowerCase().includes(activityRole.activityName.toLowerCase()),
          ))
      ) {
        addRole({ roleID: activityRole.roleID, permanent: !activityRole.live });
      }
    });

    // ------------ “apply changes” ------------

    for (const roleID of permanentRoleIDsToBeAdded) {
      await addDiscordRoleToMember({ roleID, permanent: true, add: true, userIDHash });
    }
    for (const roleID of tempRoleIDsToBeAdded) {
      await addDiscordRoleToMember({ roleID, permanent: false, add: true, userIDHash });
    }
  }

  // remove temporary roles --- new activeTemporaryRoles
  for (const activeTemporaryRole of activeTemporaryRoles) {
    if (!tempRoleIDsToBeAdded.has(activeTemporaryRole.roleID)) {
      await addDiscordRoleToMember({ roleID: activeTemporaryRole.roleID, add: false, userIDHash });
    }
  }

  // @deprecated remove all roles still in currentlyActiveActivities
  for (const activeActivity of prepare(
    'SELECT * FROM currentlyActiveActivities WHERE userIDHash = ? AND guildID = ?',
  ).all(userIDHash, guild.id) as DBCurrentlyActiveActivity[]) {
    for (const roleID of activityRoles.map(activityRole => activityRole.roleID)) {
      await addDiscordRoleToMember({ roleID, add: false, userIDHash });
      prepare(
        'DELETE FROM currentlyActiveActivities WHERE userIDHash = ? AND guildID = ? AND activityName = ?',
      ).run(userIDHash, guild.id, activeActivity.activityName);
    }
  }
}

client.on(Events.GuildCreate, guild => {
  log.info(`Joined guild ${guild.name}(${guild.id})`);
  getGuildConfig(guild.id);
});

client.on(Events.GuildDelete, guild => log.info(`Left guild ${guild.name}(${guild.id})`));

client.on(Events.Error, error => {
  log.error(error, 'The Discord WebSocket has encountered an error');
  stats.webSocketErrors++;
});

client.on(Events.GuildRoleDelete, async role => {
  prepare('DELETE FROM activityRoles WHERE roleID = ? AND guildID = ?').run(role.id, role.guild.id);
});

export function connect() {
  return client.login(config.TOKEN);
}
