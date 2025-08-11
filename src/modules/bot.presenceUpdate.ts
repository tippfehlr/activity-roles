// SPDX-License-Identifier: AGPL-3.0-only

import {
  Activity,
  ActivityType,
  CommandInteraction,
  Events,
  Guild,
  GuildMember,
  PermissionsBitField,
  Presence,
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
  getLang,
} from './db';
import { log, __ } from './messages';
import { writeIntPoint } from './metrics';
import { client, stats } from './bot';
import { Selectable } from 'kysely';
import { ActiveTemporaryRoles, ActivityRoles, StatusRoles } from './db.types';

export function checkActivityName({
  activityRole: r,
  activities,
}: {
  activityRole: Selectable<ActivityRoles>;
  activities: Activity[];
}) {
  if (r.exact) {
    if (
      activities.find(
        a =>
          a.name === r.activityName &&
          (r.state === '' || a.state === r.state) &&
          (r.details === '' || a.details === r.details),
      )
    ) {
      return true;
    }
  } else {
    if (
      activities.find(
        a =>
          a.name.toLowerCase().includes(r.activityName.toLowerCase()) &&
          (r.state === '' || a.state?.toLowerCase().includes(r.state.toLowerCase())) &&
          (r.details === '' || a.details?.toLowerCase().includes(r.details.toLowerCase())),
      )
    ) {
      return true;
    }
  }
  return false;
}

export enum addRoleStatus {
  RoleAdded,
  RoleRemoved,
}

export async function addDiscordRoleToMember({
  change,
  roleID,
  permanent,
  guild,
  member,
  interaction,
  removeAfterDays,
}: {
  change: 'add' | 'remove';
  roleID: string;
  permanent?: boolean;
  guild: Guild;
  member: GuildMember;
  interaction?: CommandInteraction;
  removeAfterDays: number | null;
}): Promise<addRoleStatus | 'abort' | undefined> {
  const role = guild.roles.cache.get(roleID);
  if (!role) {
    roleRemoved(roleID, guild.id);
    return;
  }
  if (!guild.members.me?.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
    log.warn(`no ManageRoles permission in guild ${guild.name} (${guild.id})`);
    return;
  }
  const highestBotRolePosition = guild.members.me?.roles.highest.position;
  if (!highestBotRolePosition || highestBotRolePosition <= role.position) {
    if (interaction) {
      interaction.editReply({
        content: __(
          { phrase: 'presenceUpdate->roleHigherThanBotRole', locale: getLang(interaction) },
          `<@&${role.id}>`,
        ),
      });
      return 'abort';
    } else {
      log.warn(
        `Role ${role.name} is higher than the bot’s highest role and was \
skipped (in guild ${guild.name})`,
      );
    }
    return;
  }

  if (change === 'add') {
    // does the cache need to be checked?
    // if (member.roles.cache.has(role.id)) return;
    if (permanent) {
      writeIntPoint('roles_added', 'permanent_roles_added', 1);
    } else {
      writeIntPoint('roles_added', 'temporary_roles_added', 1);
      db.insertInto('activeTemporaryRoles')
        .values({ userID: member.user.id, guildID: guild.id, roleID })
        .onConflict(oc => oc.columns(['userID', 'roleID', 'guildID']).doNothing())
        .execute();
    }
    if (removeAfterDays !== null) {
      let date = new Date();
      date.setDate(date.getDate() + removeAfterDays);
      db.insertInto('scheduledRoleActions')
        .values({
          action: 'remove',
          guildID: guild.id,
          roleID: roleID,
          userID: member.id,
          scheduledDate: date,
        })
        .onConflict(oc =>
          oc
            .columns(['roleID', 'guildID', 'userID', 'action'])
            .doUpdateSet({ scheduledDate: date }),
        )
        .execute();
    }
    await member.roles.add(role);
    stats.rolesAdded++;
    return addRoleStatus.RoleAdded;
  } else if (change === 'remove') {
    // does the cache need to be checked?
    // if (!member.roles.cache.has(role.id)) return;
    await member.roles.remove(role);
    db.deleteFrom('activeTemporaryRoles')
      .where('guildID', '=', guild.id)
      .where('roleID', '=', roleID)
      .where('userID', '=', member.user.id)
      .execute();
    stats.rolesRemoved++;
    return addRoleStatus.RoleRemoved;
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
  interaction,
}: {
  memberStatus: PresenceStatus;
  statusRoles: Selectable<StatusRoles>[];
  activities: Activity[];
  activityRoles: Selectable<ActivityRoles>[];
  guild: Guild;
  member: GuildMember;
  activeTemporaryRoles: Selectable<ActiveTemporaryRoles>[];
  interaction?: CommandInteraction;
}): Promise<{ added: number; removed: number } | 'abort'> {
  const status = { added: 0, removed: 0 };
  if (member.user.bot) return status;

  const userConfig = await getUserConfig(member.id);
  if (!userConfig.autorole) return status;

  const guildConfig = await getGuildConfig(guild.id);
  if (guildConfig.requiredRoleID !== null && !member.roles.cache.has(guildConfig.requiredRoleID)) {
    return status;
  }
  const permanentRoleIDsToBeAdded: Map<string, number | null> = new Map();
  const tempRoleIDsToBeAdded: Set<string> = new Set();

  const addRoleHelper = async (
    roleID: string,
    change: 'add' | 'remove',
    permanent: boolean,
    removeAfterDays: number | null,
  ) => {
    switch (
      await addDiscordRoleToMember({
        roleID,
        permanent,
        change,
        guild,
        member,
        removeAfterDays,
        interaction,
      })
    ) {
      case addRoleStatus.RoleAdded:
        status.added++;
        break;
      case addRoleStatus.RoleRemoved:
        status.removed++;
        break;
      case 'abort':
        return 'abort';
    }
  };
  // if user is offline, skip checking for added activities
  if (memberStatus !== 'offline') {
    const addRole = ({
      roleID,
      permanent,
      removeAfterDays,
    }: {
      roleID: string;
      permanent: boolean;
      removeAfterDays: number | null;
    }) => {
      if (permanent) {
        permanentRoleIDsToBeAdded.set(roleID, removeAfterDays);
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
      if (states.has(statusRole.type))
        addRole({ roleID: statusRole.roleID, permanent: false, removeAfterDays: null });
    });

    // ------------ activity roles ------------
    //
    activityRoles.forEach(activityRole => {
      if (checkActivityName({ activities, activityRole })) {
        addRole({
          roleID: activityRole.roleID,
          permanent: activityRole.permanent,
          removeAfterDays: activityRole.removeAfterDays,
        });
      }
    });

    // ------------ “apply changes” ------------

    for (const [roleID, removeAfterDays] of permanentRoleIDsToBeAdded) {
      if ((await addRoleHelper(roleID, 'add', true, removeAfterDays)) === 'abort') return 'abort';
    }
    for (const roleID of tempRoleIDsToBeAdded) {
      if ((await addRoleHelper(roleID, 'add', false, null)) === 'abort') return 'abort';
    }
  }

  // remove temporary roles
  for (const activeTemporaryRole of activeTemporaryRoles) {
    if (!tempRoleIDsToBeAdded.has(activeTemporaryRole.roleID)) {
      if ((await addRoleHelper(activeTemporaryRole.roleID, 'remove', false, null)) === 'abort')
        return 'abort';
    }
  }
  return status;
}

// PresenceUpdate fires once for every guild the bot shares with the user
export async function presenceUpdate(oldMember: Presence | null, newMember: Presence) {
  if (newMember.user?.bot) return;
  const startTime = Date.now();
  stats.presenceUpdates++;

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

  const userIDHash = hashUserID(newMember.userId);
  const guildConfig = await getGuildConfig(guildID);
  if (
    guildConfig.requiredRoleID !== null &&
    !newMember.member?.roles.cache.has(guildConfig.requiredRoleID)
  ) {
    return;
  }

  const addedActivities = newMember?.activities.filter(activity => {
    return !oldMember?.activities.find(oldActivity => oldActivity.name === activity.name);
  });

  // statistics for activityStats
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
}
