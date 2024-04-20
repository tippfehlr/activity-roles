import { addDiscordRoleToMember, processRoles, processRolesStatus } from './../bot';
import { Command } from '../commandHandler';

import { __, discordTranslations, log } from '../messages';
import { SlashCommandBuilder, PermissionsBitField } from 'discord.js';
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
    .setDMPermission(false),

  execute: async interaction => {
    if (!interaction.guild) return;
    const locale = getLang(interaction);

    if (checkrolesCurrentGuilds.has(interaction.guild.id)) {
      log.debug(
        `checkroles already running on ${interaction.guild.name} (${interaction.guild.id})`,
      );
      await interaction.reply({
        content: __({
          phrase:
            'checkRoles->alreadyRunning:A `/checkroles` request is already running for this guild.',
          locale,
        }),
        ephemeral: true,
      });
      return;
    }
    checkrolesCurrentGuilds.add(interaction.guild.id);

    log.debug(
      `started checkroles on ${interaction.guild.name} (${interaction.guild.id}): requested by ${interaction.user.username} (${interaction.user.id})`,
    );
    writeIntPoint('checkroles_guilds', `${interaction.guild.name} (${interaction.guild.id})`, 1);

    await interaction.deferReply({ ephemeral: true });

    const activityRoles = await getActivityRoles(interaction.guild.id);
    const statusRoles = await getStatusRoles(interaction.guild.id);
    const activeTemporaryRoles = await db
      .selectFrom('activeTemporaryRoles')
      .selectAll()
      .where('guildID', '=', interaction.guild.id)
      .execute();

    let totalUsersToCheck = 0;
    let usersChecked = 0;
    let rolesAdded = 0;
    let rolesRemoved = 0;

    // check all members that currently have temproles
    // for (const activityRole of activityRoles) {
    //   if (activityRole.permanent) break;
    //   log.debug('checking role ' + activityRole.activityName);
    //
    //   await interaction.guild.members.fetch();
    //   const members = interaction.guild.roles.cache.get(activityRole.roleID)?.members;
    //   if (!members) {
    //     log.warn('members == undefined');
    //     continue;
    //   }
    //   log.debug(`${members.size} members: ${members.map(m => m.user.username)}`);
    //   for (const [, member] of members) {
    //     log.debug(member.user.username);
    //     await interaction.guild.members.fetch({
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

    const interval = setInterval(() => {
      interaction.editReply({
        content: __(
          {
            phrase: `checkRoles->in-progress:IN PROGRESS: already checked {{{usersChecked}}}/{{{totalUsersToCheck}}} users, added {{{added}}} and removed {{{removed}}} roles.`,
            locale,
          },
          {
            usersChecked: usersChecked.toString(),
            added: rolesAdded.toString(),
            removed: rolesRemoved.toString(),
            totalUsersToCheck: totalUsersToCheck.toString(),
          },
        ),
      });
    }, 2000);

    // check all active presences
    await interaction.guild.members.fetch({ withPresences: true });
    const checkedUsers: string[] = [];
    totalUsersToCheck += interaction.guild.presences.cache.size;
    totalUsersToCheck += activeTemporaryRoles.length;
    for (const [, presence] of interaction.guild.presences.cache) {
      if (!presence.member) {
        log.error('member not available');
        continue;
      }
      switch (
        await processRoles({
          memberStatus: presence.status,
          statusRoles,
          activities: presence.activities,
          activityRoles,
          activeTemporaryRoles,
          guild: interaction.guild!,
          member: presence.member,
        })
      ) {
        case processRolesStatus.RoleAdded:
          rolesAdded++;
          break;
        case processRolesStatus.RoleRemoved:
          rolesRemoved++;
          break;
      }
      checkedUsers.push(presence.member.id);
      usersChecked++;
    }

    for (const activeTemporaryRole of activeTemporaryRoles) {
      if (!checkedUsers.includes(activeTemporaryRole.userID)) {
        checkedUsers.push(activeTemporaryRole.userID);
        const member = interaction.guild.members.cache.get(activeTemporaryRole.userID);
        if (!member) continue;

        switch (
          await addDiscordRoleToMember({
            member,
            guild: interaction.guild,
            change: 'remove',
            roleID: activeTemporaryRole.roleID,
          })
        ) {
          case processRolesStatus.RoleAdded:
            rolesAdded++;
            break;
          case processRolesStatus.RoleRemoved:
            rolesRemoved++;
            break;
        }
      }
      usersChecked++;
    }

    log.debug(`finished checkroles on ${interaction.guild.name}`);
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
            usersChecked: usersChecked.toString(),
            added: rolesAdded.toString(),
            removed: rolesRemoved.toString(),
          },
        ),
    });
    checkrolesCurrentGuilds.delete(interaction.guild.id);
    if (writeApi)
      writeApi.writePoint(
        new Point('checkroles')
          .intField('exec_total', 1)
          .intField('roles_added', rolesAdded)
          .intField('roles_removed', rolesRemoved),
      );
  },
} as Command;
