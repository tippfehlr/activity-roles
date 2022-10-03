import { getUserAutoRole, db } from './../db';
import { Command } from '../commandHandler';

import config from '../../../config';
import msg from '../messages';
import { ApplicationCommandOptionType } from 'discord.js';
export default {
  name: 'toggleautorole',
  description: 'Enables/Disables automatic role assignment',

  testOnly: config.debug,

  options: [
    {
      name: 'enabled',
      description: 'whether or not to enable the bot for this user',
      required: false,
      type: ApplicationCommandOptionType.Boolean
    }
  ],

  callback: async interaction => {
    const autoRole = interaction.options.get('enabled', false)?.value as boolean | undefined;
    const userAutoRole = getUserAutoRole(interaction.user.id);
    if (autoRole === undefined) {
      interaction.reply({ embeds: [msg.userStatus(userAutoRole)] });
    } else {
      db.prepare('UPDATE users SET autoRole = ? WHERE userId = ?').run(
        Number(autoRole),
        interaction.user.id
      );
      interaction.reply({ embeds: [msg.modifiedAutoRole(autoRole)] });
    }
  }
} as Command;
