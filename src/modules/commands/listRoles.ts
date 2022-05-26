import { Command } from '../commandHandler';
import { table } from 'table';
import fs from 'fs';

import config from '../../../config';
import msg from '../messages';
import * as db from '../db';

export default {
  name: 'listroles',
  category: 'Information',
  description: 'Lists all game roles in your guild.',
  requiredPermissions: ['MANAGE_ROLES'],

  testOnly: config.debug,
  guildOnly: true,

  callback: async interaction => {
    msg.log.command();

    const res: db.GuildDataType[] = await db.GuildData.find({
      guildID: interaction.guild!.id
    });
    if (res.length === 0) {
      interaction.reply({ content: msg.noActivityRoles() });
      return;
    }
    const array = [['#', 'Role', 'ActivityName', 'exactActivityName']];
    for (const i in res) {
      array.push([
        String(Number(i) + 1),
        interaction.guild!.roles.cache.find(role => role.id === res[i].roleID)?.name +
          ` <@&${res[i].roleID}>`,
        res[i].activityName,
        res[i].exactActivityName.toString()
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
