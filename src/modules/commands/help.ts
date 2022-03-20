import { ICommand } from 'wokcommands';

import config from '../../../config';
import msg from '../messages';

export default {
  names: 'help',
  category: 'Help',
  description: 'Shows the help page',

  slash: true,
  testOnly: config.debug,

  callback: async command => {
    msg.log.command();
    command.interaction.reply({ embeds: [msg.help.helpEmbed()] });
  }
} as ICommand;
