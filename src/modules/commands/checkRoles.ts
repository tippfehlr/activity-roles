// SPDX-License-Identifier: AGPL-3.0-only

import { addDiscordRoleToMember, processRoles, addRoleStatus } from './../bot.presenceUpdate';
import { Command } from '../commandHandler';

import { __, discordTranslations, log } from '../messages';
import {
  SlashCommandBuilder,
  PermissionsBitField,
  Guild,
  CommandInteraction,
  InteractionContextType,
  MessageFlags,
} from 'discord.js';
import { checkrolesCurrentGuilds, db, getActivityRoles, getLang, getStatusRoles } from '../db';
import { Point, writeApi, writeIntPoint } from '../metrics';

export default {
  data: new SlashCommandBuilder()
    .setName('checkroles')
    .setDescription('re-check all users/roles')
    .setDescriptionLocalizations(
      discordTranslations('checkRoles->description:re-check all users/roles'),
    )
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles)
    .setContexts([InteractionContextType.Guild]),

  execute: async interaction => {
    if (!interaction.guild) return;
    const locale = getLang(interaction);
    checkRolesStandalone({ guild: interaction.guild, interaction, locale });
  },
} as Command;

export async function checkRolesStandalone({
  guild,
  interaction,
  locale,
}: {
  guild: Guild;
  interaction?: CommandInteraction;
  locale?: string;
}) {
  if (!guild.members.me?.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
    if (interaction && locale) {
      await interaction.reply({
        content: __({ phrase: 'checkRoles->askForManageRolesPermission', locale }),
      });
      return;
    } else {
      log.warn(
        `MISSING ACCESS: LEFT guild: ${guild.name} (ID: ${guild.id}, OwnerID: \
${guild.ownerId}), Permission: MANAGE_ROLES`,
      );
      await guild.leave();
      return;
    }
  }

  if (checkrolesCurrentGuilds.has(guild.id)) {
    log.debug(`checkroles already running on ${guild.name} (${guild.id})`);
    if (interaction && locale) {
      await interaction.reply({
        content: __({ phrase: 'checkRoles->alreadyRunning', locale }),
        flags: MessageFlags.Ephemeral,
      });
    }
    return;
  }
  checkrolesCurrentGuilds.add(guild.id);

  log.debug(`started checkroles on ${guild.name} (${guild.id})`);
  writeIntPoint('checkroles_guilds', `${guild.name} (${guild.id})`, 1);

  if (interaction && locale) await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const activityRoles = await getActivityRoles(guild.id);
  const statusRoles = await getStatusRoles(guild.id);
  const activeTemporaryRoles = await db
    .selectFrom('activeTemporaryRoles')
    .selectAll()
    .where('guildID', '=', guild.id)
    .execute();

  const status = {
    totalUsers: 0,
    usersChecked: 0,
    rolesAdded: 0,
    rolesRemoved: 0,
  };

  // check all members that currently have temproles
  // for (const activityRole of activityRoles) {
  //   if (activityRole.permanent) break;
  //   log.debug('checking role ' + activityRole.activityName);
  //
  //   await guild.members.fetch();
  //   const members = guild.roles.cache.get(activityRole.roleID)?.members;
  //   if (!members) {
  //     log.warn('members == undefined');
  //     continue;
  //   }
  //   log.debug(`${members.size} members: ${members.map(m => m.user.username)}`);
  //   for (const [, member] of members) {
  //     log.debug(member.user.username);
  //     await guild.members.fetch({
  //       user: member.id,
  //       withPresences: true,
  //       force: false,
  //     });
  //     log.debug(`presence of ${member.user.username}: ${member.presence}`);
  //     const userActivities = member.presence?.activities.map(a => a.name);
  //     log.debug(`useractivity of ${member.user.username}: ${userActivities}`);
  //     if (!userActivities || !checkActivityName({ activityRole, userActivities })) {
  //       await member.roles.remove(activityRole.roleID);
  //     }
  //   }
  // }

  let interval: NodeJS.Timeout | undefined;
  if (interaction && locale) {
    interval = setInterval(() => {
      interaction.editReply({
        content: __(
          { phrase: 'checkRoles->in-progress', locale },
          {
            usersChecked: status.usersChecked.toString(),
            added: status.rolesAdded.toString(),
            removed: status.rolesRemoved.toString(),
            totalUsersToCheck: status.totalUsers.toString(),
          },
        ),
      });
    }, 2000);
  }

  // check all active presences
  await guild.members.fetch({ withPresences: true });
  const checkedUsers: string[] = [];
  status.totalUsers += guild.presences.cache.size;
  status.totalUsers += activeTemporaryRoles.length;
  for (const [, presence] of guild.presences.cache) {
    if (!presence.member) {
      log.error('member not available');
      continue;
    }
    const res = await processRoles({
      memberStatus: presence.status,
      statusRoles,
      activities: presence.activities,
      activityRoles,
      activeTemporaryRoles,
      guild,
      member: presence.member,
      interaction,
    });
    // res can only be 'abort' when interaction is passed.
    // check for this nonetheless because it could change in the future.
    if (res === 'abort') {
      if (interaction && locale) {
        clearInterval(interval);
      }
      checkrolesCurrentGuilds.delete(guild.id);
      return;
    }
    status.rolesAdded += res.added;
    status.rolesRemoved += res.removed;

    checkedUsers.push(presence.member.id);
    status.usersChecked++;
  }

  for (const activeTemporaryRole of activeTemporaryRoles) {
    if (!checkedUsers.includes(activeTemporaryRole.userID)) {
      checkedUsers.push(activeTemporaryRole.userID);
      const member = guild.members.cache.get(activeTemporaryRole.userID);
      if (!member) continue;

      switch (
        await addDiscordRoleToMember({
          member,
          guild,
          change: 'remove',
          roleID: activeTemporaryRole.roleID,
          removeAfterDays: null,
        })
      ) {
        case addRoleStatus.RoleAdded:
          status.rolesAdded++;
          break;
        case addRoleStatus.RoleRemoved:
          status.rolesRemoved++;
          break;
      }
    }
    status.usersChecked++;
  }

  log.debug(`finished checkroles on ${guild.name}`);
  if (interaction && locale) {
    clearInterval(interval);
    await interaction.editReply({
      content:
        '✅ ' +
        __(
          {
            phrase:
              'checkRoles->success:checked {{{usersChecked}}} users, added {{{added}}} and removed {{{removed}}} roles',
            locale,
          },
          {
            usersChecked: status.usersChecked.toString(),
            added: status.rolesAdded.toString(),
            removed: status.rolesRemoved.toString(),
          },
        ),
    });
  }
  checkrolesCurrentGuilds.delete(guild.id);
  if (writeApi)
    writeApi.writePoint(
      new Point('checkroles')
        .intField('exec_total', 1)
        .intField('roles_added', status.rolesAdded)
        .intField('roles_removed', status.rolesRemoved),
    );
  db.updateTable('guilds')
    .set('lastCheckRoles', new Date())
    .where('guildID', '=', guild.id)
    .execute();
}
