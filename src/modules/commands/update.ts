import { ICommand } from 'wokcommands'

import messages from '../messages';
import db from '../db';
import config from '../../../config';

export default {
  names: 'update',
  category: 'Utility',
  description: 'Updates all game roles',
  requiredPermissions: ['ADMINISTRATOR'],

  slash: true,
  testOnly: config.debug,

  callback: async command => {
    messages.log.activity();
    if(command.guild) db.checkAllRoles(command.guild);
    return 'ok';
  },
} as ICommand