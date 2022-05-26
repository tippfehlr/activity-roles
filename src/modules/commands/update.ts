import { Command } from '../commandHandler';
import msg from '../messages';
import * as db from '../db';
import config from '../../../config';

export default {
  name: 'update',
  category: 'Utility',
  description: 'Updates all activity roles.',

  testOnly: config.debug,
  guildOnly: true,

  callback: async interaction => {
    msg.log.command();
    db.checkAllRoles(interaction.guild!);
    interaction.reply({ content: msg.ok(), ephemeral: true });
  }
} as Command;
