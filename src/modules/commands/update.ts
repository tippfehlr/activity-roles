import { ICommand } from 'wokcommands';

import msg from '../messages';
import * as db from '../db';
import config from '../../../config';

export default {
  names: 'update',
  category: 'Utility',
  description: 'Updates all activity roles.',

  slash: true,
  testOnly: config.debug,
  guildOnly: true,

  callback: async command => {
    msg.log.command();
    if (command.guild) db.checkAllRoles(command.guild);
    command.interaction.reply({ content: msg.ok(), ephemeral: true });
  }
} as ICommand;
