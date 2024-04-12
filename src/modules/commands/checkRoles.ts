import { processRoles } from './../bot';
import { Command } from '../commandHandler';

import { __, discordTranslations, log } from '../messages';
import { SlashCommandBuilder, PermissionsBitField } from 'discord.js';
import { db, getLang } from '../db';

export default {
  data: new SlashCommandBuilder()
    .setName('checkroles')
    .setDescription('re-check all users/roles')
    .setDescriptionLocalizations(discordTranslations('re-check all users/roles'))
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles)
    .setDMPermission(false),

  execute: async interaction => {
    if (!interaction.guild) return;

    await interaction.reply({
      content: 'this command is not ready to be used yet, sorry.',
      ephemeral: true,
    });
    return;

    // if (checkrolesCurrentGuilds.has(interaction.guild.id)) {
    //   log.debug(
    //     `checkroles already running on ${interaction.guild.name} (${interaction.guild.id})`,
    //   );
    //   await interaction.reply({
    //     content: 'A `/checkroles` request is already running for this guild.',
    //     ephemeral: true,
    //   });
    //   return;
    // }
    // checkrolesCurrentGuilds.add(interaction.guild.id);
    //
    // log.debug(
    //   `started checkroles on ${interaction.guild.name} (${interaction.guild.id}): requested by ${interaction.user.username} (${interaction.user.id})`,
    // );
    // await interaction.deferReply({ ephemeral: true });
    // const locale = getLang(interaction);
    // if (!interaction.guild) return;
    //
    // console.time('database fetch');
    // const activityRoles = prepare('SELECT * from activityRoles WHERE guildID = ?').all(
    //   interaction.guild.id,
    // ) as DBActivityRole[];
    // const statusRoles = prepare('SELECT * from statusRoles WHERE guildID = ?').all(
    //   interaction.guild.id,
    // ) as DBStatusRole[];
    // const activeTemporaryRoles = prepare(
    //   'SELECT * from activeTemporaryRoles WHERE guildID = ?',
    // ).all(interaction.guild.id) as DBActiveTemporaryRoles[];
    // console.timeEnd('database fetch');
    //
    // interaction.guild.presences.cache.forEach(presence => {
    //   if (!interaction.guild) return;
    //   if (!presence.member) return;
    //   processRoles({
    //     memberStatus: presence.status,
    //     statusRoles,
    //     activities: presence.activities,
    //     activityRoles,
    //     activeTemporaryRoles,
    //     guild: interaction.guild,
    //     member: presence.member,
    //   });
    // });

    // for (const activeTemporaryRole of activeTemporaryRoles) {
    //   if (!userHashes.includes(activeTemporaryRole.userIDHash)) {
    //   }
    // }

    // fetching all members is waaaaay too slow (a couple members per second, and it blocks the bot for that server)
    // log.debug(`before fetch: ${interaction.guild.members.cache.size} members`);
    // console.time('fetching members');
    // await interaction.guild.members.fetch();
    // console.timeEnd('fetching members');
    // log.debug(`after fetch: ${interaction.guild.members.cache.size} members`);
    //
    // console.time('re-checking roles');
    //
    // let i = 0;
    // const total = interaction.guild.members.cache.size;
    // interaction.guild.members.cache.forEach(async member => {
    //   await member.fetch(true);
    //   if (member.user.bot) return;
    //   if (!interaction.guild) return;
    //   if (member.presence?.status) {
    //     await processRoles({
    //       memberStatus: member.presence?.status,
    //       statusRoles,
    //       activities: member.presence.activities,
    //       activityRoles,
    //       activeTemporaryRoles,
    //       guild: interaction.guild,
    //       member,
    //     });
    //   } else {
    //     activityRoles.forEach(async role => {
    //       if (role.live === 1) await member.roles.remove(role.roleID);
    //     });
    //     statusRoles.forEach(async role => {
    //       await member.roles.remove(role.roleID);
    //     });
    //     console.log('no presences, removed all roles');
    //   }
    //   console.log(`${++i} / ${total}`);
    // });
    // console.timeEnd('re-checking roles');
    // await interaction.editReply({
    //   content: '✅ ' + __({ phrase: 're-checked all users/roles', locale }),
    // });
    // checkrolesCurrentGuilds.delete(interaction.guild.id);
  },
} as Command;
