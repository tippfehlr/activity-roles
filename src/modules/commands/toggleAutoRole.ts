import { Command } from '../commandHandler';

import config from '../../../config';
import msg from '../messages';
import * as db from '../db';
export default {
  name: 'toggleautorole',
  category: 'User Configuration',
  description: 'Enables/Disables automatic role assignment',

  testOnly: config.debug,

  options: [
    {
      name: 'enabled',
      description: 'whether or not to enable the bot for this user',
      required: false,
      type: 'BOOLEAN'
    }
  ],

  callback: async interaction => {
    msg.log.command();

    const autoRole = interaction.options.getBoolean('enabled');
    const res: db.UserConfigType | null = await db.UserConfig.findOne({
      userID: interaction.user.id
    });
    if (!res) {
      await db.checkUser(interaction.user);
      await interaction.reply({ embeds: [msg.errorEmbed()] });
      return;
    }
    if (autoRole === null) {
      interaction.reply({ embeds: [msg.userStatus(res.autoRole)] });
    } else {
      await db.UserConfig.findOneAndUpdate({ userID: interaction.user.id }, { autoRole });
      interaction.reply({ embeds: [msg.modifiedAutoRole(autoRole)] });
    }
  }
} as Command;
