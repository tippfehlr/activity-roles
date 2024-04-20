import { addDiscordRoleToMember, processRoles, processRolesStatus } from './../bot.presenceUpdate';
import { Command } from '../commandHandler';

import { __, discordTranslations, log } from '../messages';
import { SlashCommandBuilder, PermissionsBitField, Guild, CommandInteraction } from 'discord.js';
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
    checkRoles({ guild: interaction.guild, interaction, locale });
  },
} as Command;

export async function checkRoles({
  guild,
  interaction,
  locale,
}: {
  guild: Guild;
  interaction?: CommandInteraction;
  locale?: string;
}) {
  if (checkrolesCurrentGuilds.has(guild.id)) {
    log.debug(`checkroles already running on ${guild.name} (${guild.id})`);
    if (interaction && locale) {
      await interaction.reply({
        content: __({
          phrase:
            'checkRoles->alreadyRunning:A `/checkroles` request is already running for this guild.',
          locale,
        }),
        ephemeral: true,
      });
    }
    return;
  }
  checkrolesCurrentGuilds.add(guild.id);

  log.debug(`started checkroles on ${guild.name} (${guild.id})`);
  writeIntPoint('checkroles_guilds', `${guild.name} (${guild.id})`, 1);

  if (interaction && locale) await interaction.deferReply({ ephemeral: true });

  const activityRoles = await getActivityRoles(guild.id);
  const statusRoles = await getStatusRoles(guild.id);
  const activeTemporaryRoles = await db
    .selectFrom('activeTemporaryRoles')
    .selectAll()
    .where('guildID', '=', guild.id)
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
  }

  // check all active presences
  await guild.members.fetch({ withPresences: true });
  const checkedUsers: string[] = [];
  totalUsersToCheck += guild.presences.cache.size;
  totalUsersToCheck += activeTemporaryRoles.length;
  for (const [, presence] of guild.presences.cache) {
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
        guild: guild!,
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
      const member = guild.members.cache.get(activeTemporaryRole.userID);
      if (!member) continue;

      switch (
        await addDiscordRoleToMember({
          member,
          guild: guild,
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
            usersChecked: usersChecked.toString(),
            added: rolesAdded.toString(),
            removed: rolesRemoved.toString(),
          },
        ),
    });
  }
  checkrolesCurrentGuilds.delete(guild.id);
  if (writeApi)
    writeApi.writePoint(
      new Point('checkroles')
        .intField('exec_total', 1)
        .intField('roles_added', rolesAdded)
        .intField('roles_removed', rolesRemoved),
    );
  db.updateTable('guilds')
    .set('lastCheckRoles', new Date())
    .where('guildID', '=', guild.id)
    .execute();
}
