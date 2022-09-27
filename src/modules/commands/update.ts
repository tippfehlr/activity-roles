import { Command } from '../commandHandler';
import msg from '../messages';
import config from '../../../config';
import { checkAllRoles } from '../db';

export default {
  name: 'update',
  category: 'Utility',
  description: 'Updates all activity roles.',

  testOnly: config.debug,
  guildOnly: true,

  callback: async interaction => {
    await interaction.deferReply({ ephemeral: true });
    await checkAllRoles(interaction.guild!);
    interaction.editReply({ content: msg.ok() });
  }
} as Command;
