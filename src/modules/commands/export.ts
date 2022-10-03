import { db, ActivityRoles } from './../db';
import { Command } from '../commandHandler';
import fs from 'fs';

import config from '../../../config';
import { PermissionsBitField } from 'discord.js';

export default {
  name: 'export',
  description: 'Exports all game roles in your guild as a JSON file.',
  requiredPermissions: [PermissionsBitField.Flags.ManageRoles],

  testOnly: config.debug,
  guildOnly: true,

  callback: async interaction => {
    const activityRoles: ActivityRoles[] = db
      .prepare('SELECT * FROM activityRoles WHERE guildID = ?')
      .all(interaction.guild!.id);
    const array = [];
    for (const activityRole of activityRoles) {
      array.push({
        guildID: activityRole.guildID,
        roleID: activityRole.roleID,
        activityName: activityRole.activityName,
        live: Boolean(activityRole.live),
        exactActivityName: Boolean(activityRole.exactActivityName)
      });
    }
    fs.writeFileSync(config.exportFileName, JSON.stringify(array, null, 1));
    await interaction.reply({ files: [config.exportFileName] });
    fs.unlinkSync(config.exportFileName);
  }
} as Command;
