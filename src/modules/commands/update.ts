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
    await interaction.deferReply({ ephemeral: true });
    msg.log.command();
    await db.checkAllRoles(interaction.guild!);
    interaction.editReply({ content: msg.ok() });
  }
} as Command;
