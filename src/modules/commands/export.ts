import { ICommand } from 'wokcommands';
import fs from 'fs';

import config from '../../../config';
import msg from '../messages';
import * as db from '../db';

export default {
  names: 'export',
  category: 'Information',
  description: 'Exports all game roles in your guild as a JSON file.',

  slash: true,
  testOnly: config.debug,

  callback: async command => {
    msg.log.activity();

    const res: db.GuildDataType[] = await db.GuildData.find({ guildID: command.guild?.id });
    const array = [];
    for (const i in res) {
      array.push([String(Number(i) + 1), `${command.guild?.roles.cache.find((role) => role.id === res[i].roleID)?.name} <@&${res[i].roleID}>`, res[i].activityName, res[i].exactActivityName.toString()]);
    }
    fs.writeFileSync(config.exportFileName, JSON.stringify(array, null, 1));
    await command.interaction.reply({ files: [config.exportFileName] });
    fs.unlinkSync(config.exportFileName);
  }
} as ICommand;