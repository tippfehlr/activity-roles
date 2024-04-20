import {
  Activity,
  ActivityType,
  Events,
  Guild,
  GuildMember,
  PermissionsBitField,
  PresenceStatus,
} from 'discord.js';
import {
  addActivity,
  getActivityRoles,
  getGuildConfig,
  getStatusRoles,
  getUserConfig,
  db,
  hashUserID,
  roleRemoved,
} from './db';
import { log } from './messages';
import { writeIntPoint } from './metrics';
import { client, stats } from './bot';
import { Selectable } from 'kysely';
import { ActiveTemporaryRoles, ActivityRoles, StatusRoles } from './db.types';

export function checkActivityName({
  activityRole,
  userActivities,
}: {
  activityRole: Selectable<ActivityRoles>;
  userActivities: string[];
}) {
  if (activityRole.exactActivityName) {
    if (userActivities.includes(activityRole.activityName)) {
      return true;
    }
  } else {
    if (
      userActivities.find(userActivity =>
        userActivity.toLowerCase().includes(activityRole.activityName.toLowerCase()),
      )
    ) {
      return true;
    }
  }
  return false;
}

export enum processRolesStatus {
  RoleAdded,
  RoleRemoved,
}

export async function addDiscordRoleToMember({
  change,
  roleID,
  permanent,
  guild,
  member,
}: {
  change: 'add' | 'remove';
  roleID: string;
  permanent?: boolean;
  guild: Guild;
  member: GuildMember;
}): Promise<processRolesStatus | undefined> {
  const role = guild.roles.cache.get(roleID);
  if (!role) {
    roleRemoved(roleID, guild.id);
    return;
  }
  const highestBotRolePosition = guild.members.me?.roles.highest.position;
  if (!highestBotRolePosition || highestBotRolePosition <= role.position) {
    log.warn(
      `Role ${role.name} is higher than the bot’s highest role and was skipped (in guild ${guild.name})`,
    );
    return;
  }

  if (change === 'add') {
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
    return processRolesStatus.RoleAdded;
  } else if (change === 'remove') {
    // does the cache need to be checked?
    if (!member.roles.cache.has(role.id)) {
      // log.warn(
      //   `can’t remove the role: ${member.displayName} (${member.user.username}) doesn’t have the role ${role.name} in guild ${guild.name} (${guild.id})`,
      // );
      return;
    }
    await member.roles.remove(role);
    db.deleteFrom('activeTemporaryRoles')
      .where('guildID', '=', guild.id)
      .where('roleID', '=', roleID)
      .where('userID', '=', member.user.id)
      .execute();
    stats.rolesRemoved++;

    return processRolesStatus.RoleRemoved;
  }
}

export async function processRoles({
  memberStatus,
  statusRoles,
  activities,
  activityRoles,
  activeTemporaryRoles,
  guild,
  member,
}: {
  memberStatus: PresenceStatus;
  statusRoles: Selectable<StatusRoles>[];
  activities: Activity[];
  activityRoles: Selectable<ActivityRoles>[];
  guild: Guild;
  member: GuildMember;
  activeTemporaryRoles: Selectable<ActiveTemporaryRoles>[];
}): Promise<processRolesStatus | undefined> {
  const permanentRoleIDsToBeAdded: Set<string> = new Set();
  const tempRoleIDsToBeAdded: Set<string> = new Set();

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
      if (checkActivityName({ userActivities, activityRole })) {
        addRole({ roleID: activityRole.roleID, permanent: activityRole.permanent });
      }
    });

    // ------------ “apply changes” ------------

    for (const roleID of permanentRoleIDsToBeAdded) {
      return await addDiscordRoleToMember({
        roleID,
        permanent: true,
        change: 'add',
        guild,
        member,
      });
    }
    for (const roleID of tempRoleIDsToBeAdded) {
      return await addDiscordRoleToMember({
        roleID,
        permanent: false,
        change: 'add',
        guild,
        member,
      });
    }
  }

  // remove temporary roles --- new activeTemporaryRoles
  for (const activeTemporaryRole of activeTemporaryRoles) {
    if (!tempRoleIDsToBeAdded.has(activeTemporaryRole.roleID)) {
      return await addDiscordRoleToMember({
        roleID: activeTemporaryRole.roleID,
        change: 'remove',
        guild,
        member,
      });
    }
  }
}

export function initPresenceUpdate() {
  // PresenceUpdate fires once for every guild the bot shares with the user
  client.on(Events.PresenceUpdate, async (oldMember, newMember) => {
    const startTime = Date.now();
    stats.presenceUpdates++;

    // eslint-disable-next-line
    let debug = false;
    if (newMember.userId === '712702707986595880' && newMember.guild?.id === '226115726509998090') {
      // eslint-disable-next-line
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
        activeTemporaryRoles.push({
          userID: newMember.userId,
          roleID: role.roleID,
          guildID: role.guildID,
        });
        await db
          .insertInto('activeTemporaryRoles')
          .values({ userID: newMember.userId, roleID: role.roleID, guildID: role.guildID })
          .onConflict(oc => oc.columns(['userID', 'roleID', 'guildID']).doNothing())
          .execute();
      }
      db.deleteFrom('activeTemporaryRolesHashed').where('userIDHash', '=', userIDHash).execute();
    }

    // return if guild doesn’t have any roles
    if (
      statusRoles.length === 0 &&
      activityRoles.length === 0 &&
      activeTemporaryRoles.length === 0
    ) {
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
}
