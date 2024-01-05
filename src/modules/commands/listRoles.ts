import { ActivityType, EmbedBuilder, PermissionsBitField, SlashCommandBuilder } from 'discord.js';
import { table } from 'table';
import fs from 'fs';

import { db, DBActivityRole, DBStatusRole, getLang } from '../db';
import { Command } from '../commandHandler';
import { __, __h_dc, getEnumKey } from '../messages';
import config from '../config';

export default {
  data: new SlashCommandBuilder()
    .setName('listroles')
    .setDescription('Lists all managed roles in your guild.')
    .setDescriptionLocalizations(__h_dc('Lists all managed roles in your guild.'))
    .setDMPermission(false),

  execute: async interaction => {
    const locale = getLang(interaction);

    const res: DBActivityRole[] = db
      .prepare('SELECT * FROM activityRoles WHERE guildID = ?')
      .all(interaction.guild!.id) as DBActivityRole[];
    let activityRolesTable = '';
    if (res.length === 0) {
      activityRolesTable = __({ phrase: 'There are no activity roles in this guild.', locale });
    } else {
      const array = [
        [
          '#',
          __({ phrase: 'Role', locale }),
          __({ phrase: 'Activity', locale }),
          __({ phrase: 'Exact Activity Name', locale }),
          __({ phrase: 'Permanent', locale })
        ]
      ];
      for (const i in res) {
        array.push([
          String(Number(i) + 1),
          interaction.guild!.roles.cache.find(role => role.id === res[i].roleID)?.name +
          ` <@&${res[i].roleID}>`,
          res[i].activityName,
          String(Boolean(res[i].exactActivityName)),
          String(!Boolean(res[i].live))
        ]);
      }
      activityRolesTable = table(array, {
        drawHorizontalLine: (index: number) => {
          return index === 0 || index === 1 || index === array.length;
        }
      });
    }
    // ------------ status roles ------------

    let statusRoles = '';
    (
      db
        .prepare('SELECT * FROM statusRoles WHERE guildID = ?')
        .all(interaction.guildId) as DBStatusRole[]
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
          .setColor(config.COLOR)
      ],
      files: [filename]
    });
    fs.unlinkSync(filename);
  }
} as Command;
