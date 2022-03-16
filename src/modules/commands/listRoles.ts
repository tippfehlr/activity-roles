import { ICommand } from 'wokcommands';
import { table } from 'table';
import fs from 'fs';

import config from '../../../config';
import msg from '../messages';
import * as db from '../db';

export default {
  names: 'listRoles',
  category: 'Information',
  description: 'Lists all game roles in your guild.',

  slash: true,
  testOnly: config.debug,

  callback: async command => {
    msg.log.activity();

    const res: db.GuildDataType[] = await db.GuildData.find({
      guildID: command.guild?.id,
    });
    if (res.length === 0) {
      command.interaction.reply({ content: msg.noActivityRoles() });
      return;
    }
    const array = [['#', 'Role', 'ActivityName', 'exactActivityName']];
    for (const i in res) {
      array.push([
        String(Number(i) + 1),
        `${command.guild?.roles.cache.find(role => role.id === res[i].roleID)?.name
        } <@&${res[i].roleID}>`,
        res[i].activityName,
        res[i].exactActivityName.toString(),
      ]);
    }
    const response = table(array, {
      drawHorizontalLine: (index: number) => {
        return index === 0 || index === 1 || index === array.length;
      },
    });
    fs.writeFileSync(config.listRolesFileName, response);
    await command.interaction.reply({
      /*content: msg.activityRolesListInFile(),*/ files: [
        config.listRolesFileName,
      ],
    });
    fs.unlinkSync(config.listRolesFileName);
  },
} as ICommand;
