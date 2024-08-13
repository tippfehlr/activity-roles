// SPDX-License-Identifier: AGPL-3.0-only

import { ActivityType, EmbedBuilder, SlashCommandBuilder } from 'discord.js';

import { db, getLang } from '../db';
import { Command } from '../commandHandler';
import { __, discordTranslations, getEnumKey } from '../messages';
import config from '../config';
import { createActivityRolesTable } from '../activityRolesTable';
import { unlinkSync, writeFileSync } from 'fs';

export default {
  data: new SlashCommandBuilder()
    .setName('listroles')
    .setDescription('Lists all managed roles in your guild.')
    .setDescriptionLocalizations(discordTranslations('Lists all managed roles in your guild.'))
    .setDMPermission(false),

  execute: async interaction => {
    if (!interaction.guild) return;
    const locale = getLang(interaction);

    const activityRoles = await db
      .selectFrom('activityRoles')
      .selectAll()
      .where('guildID', '=', interaction.guildId)
      .execute();

    let activityRolesTable = '';
    if (activityRoles.length === 0) {
      activityRolesTable = __({ phrase: 'There are no activity roles in this guild.', locale });
    } else {
      activityRolesTable = createActivityRolesTable({
        activityRoles,
        guild: interaction.guild,
        locale,
      });
    }
    // ------------ status roles ------------

    let statusRoles = '';
    (
      await db
        .selectFrom('statusRoles')
        .selectAll()
        .where('guildID', '=', interaction.guildId)
        .execute()
    ).forEach(statusRole => {
      statusRoles += `**${getEnumKey(ActivityType, statusRole.type)}:** <@&${statusRole.roleID}>\n`;
    });
    if (statusRoles === '') {
      statusRoles = __({ phrase: 'There are no status roles in this guild', locale });
    }

    const filename = `listActivityRoles-${interaction.id.substring(0, 7)}.txt`;
    writeFileSync(filename, activityRolesTable);
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle(__({ phrase: 'Status Roles', locale }))
          .setDescription(statusRoles)
          .setColor(config.COLOR),
      ],
      files: [filename],
    });
    unlinkSync(filename);
  },
} as Command;
