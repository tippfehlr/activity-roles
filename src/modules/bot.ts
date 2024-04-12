import Discord, {
  ActivityType,
  Events,
  GatewayIntentBits,
  Options,
  PermissionsBitField,
} from 'discord.js';
import { Selectable } from 'kysely';

import {
  addActivity,
  getActivityRoles,
  getUserCount,
  getGuildConfig,
  getRolesCount,
  getStatusRoles,
  getUserConfig,
  db,
  hashUserID,
} from './db';
import config from './config';
import { i18n, log } from './messages';
import CommandHandler from './commandHandler';
import { configureInfluxDB, writeIntPoint } from './metrics';
import { ActiveTemporaryRoles, ActivityRoles, StatusRoles } from './db.types';

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

client.on(Events.ClientReady, async () => {
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
  const setActivityUsers = async () => {
    client.user?.setPresence({
      activities: [
        {
          name: i18n.__n({
            singular: '%s user',
            plural: '%s users',
            locale: 'en-US',
            count: await getUserCount(),
          }),
          type: ActivityType.Watching,
        },
      ],
    });
    setTimeout(setActivityActivityRoles, 10 * 1000);
  };
  const setActivityActivityRoles = async () => {
    client.user?.setPresence({
      activities: [
        {
          name: i18n.__n({
            singular: '%s role',
            plural: '%s roles',
            locale: 'en-US',
            count: await getRolesCount(),
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
    `The bot is currently on ${client.guilds.cache.size} guilds with ${await getUserCount()} users and manages ${await getRolesCount()} roles`,
  );
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

  const userConfig = await getUserConfig(newMember.userId);
  if (!userConfig.autorole) return;

  const userIDHash = hashUserID(newMember.userId);
  const guildConfig = await getGuildConfig(guildID);
  // if (debug) console.time('fetch member');
  // await newMember.member?.fetch(true);
  // if (debug) console.timeEnd('fetch member');

  if (
    guildConfig.requiredRoleID !== null &&
    !newMember.member?.roles.cache.has(guildConfig.requiredRoleID)
  ) {
    return;
  }

  const addedActivities = newMember?.activities.filter(activity => {
    return !oldMember?.activities.find(oldActivity => oldActivity.name === activity.name);
  });

  for (const activity of addedActivities) {
    if (activity.name !== 'Custom Status') addActivity(guildID, activity.name);
  }

  const statusRoles = await getStatusRoles(guildID);
  const activityRoles = await getActivityRoles(guildID);

  const activeTemporaryRoles = await db
    .selectFrom('activeTemporaryRoles')
    .selectAll()
    .where('userID', '=', newMember.userId)
    .where('guildID', '=', guildID)
    .execute();
  if (activeTemporaryRoles.length === 0) {
    const activeTemporaryRolesHashed = await db
      .selectFrom('activeTemporaryRolesHashed')
      .selectAll()
      .where('userIDHash', '=', userIDHash)
      .where('guildID', '=', guildID)
      .execute();

    for (const role of activeTemporaryRolesHashed) {
      activeTemporaryRoles.push({ userID: newMember.userId, ...role });
      await db
        .insertInto('activeTemporaryRoles')
        .values({ userID: newMember.userId, ...role })
        .onConflict(oc => oc.columns(['userID', 'roleID', 'guildID']).doNothing())
        .execute();
    }
    db.deleteFrom('activeTemporaryRolesHashed').where('userIDHash', '=', userIDHash).execute();
  }

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
  statusRoles: Selectable<StatusRoles>[];
  activities: Discord.Activity[];
  activityRoles: Selectable<ActivityRoles>[];
  guild: Discord.Guild;
  member: Discord.GuildMember;
  activeTemporaryRoles: Selectable<ActiveTemporaryRoles>[];
}) {
  const permanentRoleIDsToBeAdded: Set<string> = new Set();
  const tempRoleIDsToBeAdded: Set<string> = new Set();

  const highestBotRolePosition = guild.members.me?.roles.highest.position;
  const addDiscordRoleToMember = async ({
    add,
    roleID,
    permanent,
  }: {
    add: boolean;
    roleID: string;
    permanent?: boolean;
  }) => {
    const role = guild.roles.cache.get(roleID);
    if (!role) {
      db.deleteFrom('activityRoles')
        .where('guildID', '=', guild.id)
        .where('roleID', '=', roleID)
        .execute();
      db.deleteFrom('statusRoles')
        .where('guildID', '=', guild.id)
        .where('roleID', '=', roleID)
        .execute();
      db.deleteFrom('activeTemporaryRoles')
        .where('guildID', '=', guild.id)
        .where('roleID', '=', roleID)
        .execute();
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
        // log.warn(
        //   `${member.displayName} (${member.user.username}) already has the role ${role.name} in guild ${guild.name} (${guild.id})`,
        // );
        return;
      }
      if (permanent) {
        writeIntPoint('roles_added', 'permanent_roles_added', 1);
      } else {
        writeIntPoint('roles_added', 'temporary_roles_added', 1);
        db.insertInto('activeTemporaryRoles')
          .values({ userID: member.user.id, guildID: guild.id, roleID })
          .onConflict(oc => oc.columns(['userID', 'roleID', 'guildID']).doNothing())
          .execute();
      }
      await member.roles.add(role);
      stats.rolesAdded++;
    } else {
      // does the cache need to be checked?
      if (!member.roles.cache.has(role.id)) {
        // log.warn(
        //   `can’t remove the role: ${member.displayName} (${member.user.username}) doesn’t have the role ${role.name} in guild ${guild.name} (${guild.id})`,
        // );
        return;
      }
      await member.roles.remove(role);
      stats.rolesRemoved++;

      db.deleteFrom('activeTemporaryRoles')
        .where('guildID', '=', guild.id)
        .where('roleID', '=', roleID)
        .where('userID', '=', member.user.id)
        .execute();
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
        addRole({ ...activityRole });
      }
    });

    // ------------ “apply changes” ------------

    for (const roleID of permanentRoleIDsToBeAdded) {
      await addDiscordRoleToMember({ roleID, permanent: true, add: true });
    }
    for (const roleID of tempRoleIDsToBeAdded) {
      await addDiscordRoleToMember({ roleID, permanent: false, add: true });
    }
  }

  // remove temporary roles --- new activeTemporaryRoles
  for (const activeTemporaryRole of activeTemporaryRoles) {
    if (!tempRoleIDsToBeAdded.has(activeTemporaryRole.roleID)) {
      await addDiscordRoleToMember({ roleID: activeTemporaryRole.roleID, add: false });
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
  await db.deleteFrom('statusRoles').where('roleID', '=', role.id).execute();
});

export function connect() {
  return client.login(config.TOKEN);
}
