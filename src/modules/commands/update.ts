import { ICommand } from 'wokcommands';

import msg from '../messages';
import * as db from '../db';
import config from '../../../config';

export default {
  names: 'update',
  category: 'Utility',
  description: 'Updates all game roles',
  requiredPermissions: ['ADMINISTRATOR'],

  slash: true,
  testOnly: config.debug,

  callback: async command => {
    msg.log.activity();
    if (command.guild) db.checkAllRoles(command.guild);
    command.interaction.reply({ content: msg.ok(), ephemeral: true });
  }
} as ICommand;
