import { Command } from '../commandHandler';

import config from '../../../config';
import msg from '../messages';

export default {
  name: 'help',
  category: 'Help',
  description: 'Shows the help page',

  testOnly: config.debug,

  callback: async interaction => {
    interaction.reply({ embeds: [msg.help.helpEmbed()] });
  }
} as Command;
