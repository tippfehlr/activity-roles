import { Command } from '../commandHandler';
import fs from 'fs';

import config from '../../../config';
import msg from '../messages';
import * as db from '../db';

export default {
  name: 'export',
  category: 'Information',
  description: 'Exports all game roles in your guild as a JSON file.',
  requiredPermissions: ['MANAGE_ROLES'],

  testOnly: config.debug,
  guildOnly: true,

  callback: async interaction => {
    msg.log.command();

    const res: db.GuildDataType[] = await db.GuildData.find({
      guildID: interaction.guild!.id
    });
    const array = [];
    for (const i in res) {
      array.push([
        String(Number(i) + 1),
        `${interaction.guild!.roles.cache.find(role => role.id === res[i].roleID)?.name} <@&${
          res[i].roleID
        }>`,
        res[i].activityName,
        res[i].exactActivityName.toString()
      ]);
    }
    fs.writeFileSync(config.exportFileName, JSON.stringify(array, null, 1));
    await interaction.reply({ files: [config.exportFileName] });
    fs.unlinkSync(config.exportFileName);
  }
} as Command;
