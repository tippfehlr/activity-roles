import { PermissionsBitField } from 'discord.js';
import { db, GuildData } from './../db';
import { Command } from '../commandHandler';
import { table } from 'table';
import fs from 'fs';

import config from '../../../config';
import msg from '../messages';

export default {
  name: 'listroles',
  category: 'Information',
  description: 'Lists all game roles in your guild.',
  requiredPermissions: [PermissionsBitField.Flags.ManageRoles],

  testOnly: config.debug,
  guildOnly: true,

  callback: async interaction => {
    const res: GuildData[] = db
      .prepare('SELECT * FROM guildData WHERE guildID = ?')
      .all(interaction.guild!.id);
    if (res.length === 0) {
      interaction.reply({ content: msg.noActivityRoles() });
      return;
    }
    const array = [['#', 'Role', 'Activity', 'exact activity name', 'live']];
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
    fs.writeFileSync(config.listRolesFileName, response);
    await interaction.reply({
      /*content: msg.activityRolesListInFile(),*/ files: [config.listRolesFileName]
    });
    fs.unlinkSync(config.listRolesFileName);
  }
} as Command;
