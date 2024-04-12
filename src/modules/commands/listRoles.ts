import { ActivityType, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { table } from 'table';
import fs from 'fs';

import { db, getLang } from '../db';
import { Command } from '../commandHandler';
import { __, discordTranslations, getEnumKey } from '../messages';
import config from '../config';

export default {
  data: new SlashCommandBuilder()
    .setName('listroles')
    .setDescription('Lists all managed roles in your guild.')
    .setDescriptionLocalizations(discordTranslations('Lists all managed roles in your guild.'))
    .setDMPermission(false),

  execute: async interaction => {
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
      const array = [
        [
          '#',
          __({ phrase: 'Role', locale }),
          __({ phrase: 'Activity', locale }),
          __({ phrase: 'Exact Activity Name', locale }),
          __({ phrase: 'Permanent', locale }),
        ],
      ];
      for (const i in activityRoles) {
        array.push([
          String(Number(i) + 1),
          interaction.guild!.roles.cache.find(role => role.id === activityRoles[i].roleID)?.name +
            ` <@&${activityRoles[i].roleID}>`,
          activityRoles[i].activityName,
          String(activityRoles[i].exactActivityName),
          String(activityRoles[i].permanent),
        ]);
      }
      activityRolesTable = table(array, {
        drawHorizontalLine: (index: number) => {
          return index === 0 || index === 1 || index === array.length;
        },
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
    fs.writeFileSync(filename, activityRolesTable);
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle(__({ phrase: 'Status Roles', locale }))
          .setDescription(statusRoles)
          .setColor(config.COLOR),
      ],
      files: [filename],
    });
    fs.unlinkSync(filename);
  },
} as Command;
