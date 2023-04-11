import { PermissionsBitField, SlashCommandBuilder } from 'discord.js';
import { table } from 'table';
import fs from 'fs';

import { db, DBActivityRole, getLang } from '../db';
import { Command } from '../commandHandler';
import { __, __h_dc } from '../messages';

export default {
  data: new SlashCommandBuilder()
    .setName('listactivityroles')
    .setDescription('Lists all activity roles in your guild.')
    .setDescriptionLocalizations(__h_dc('Lists all activity roles in your guild.'))
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles),

  execute: async interaction => {
    const locale = getLang(interaction);

    const res: DBActivityRole[] = db
      .prepare('SELECT * FROM activityRoles WHERE guildID = ?')
      .all(interaction.guild!.id) as DBActivityRole[];
    if (res.length === 0) {
      interaction.reply({
        content: __({ phrase: 'There are no activity roles in this guild.', locale })
      });
      return;
    }
    const array = [
      [
        '#',
        __({ phrase: 'Role', locale }),
        __({ phrase: 'Activity', locale }),
        __({ phrase: 'Exact Activity Name', locale }),
        __({ phrase: 'Live', locale })
      ]
    ];
    for (const i in res) {
      array.push([
        String(Number(i) + 1),
        interaction.guild!.roles.cache.find(role => role.id === res[i].roleID)?.name +
        ` <@&${res[i].roleID}>`,
        res[i].activityName,
        String(Boolean(res[i].exactActivityName)),
        String(Boolean(res[i].live))
      ]);
    }
    const response = table(array, {
      drawHorizontalLine: (index: number) => {
        return index === 0 || index === 1 || index === array.length;
      }
    });
    fs.writeFileSync(interaction.id + '.txt', response);
    await interaction.reply({
      files: [interaction.id]
    });
    fs.unlinkSync(interaction.id + '.txt');
  }
} as Command;
