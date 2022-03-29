import { ICommand } from 'wokcommands';

import config from '../../../config';
import msg from '../messages';
import * as db from '../db';
export default {
  names: ['toggleautorole'],
  category: 'User Configuration',
  description: 'Enables/Disables automatic role assignment',

  slash: true,
  testOnly: config.debug,

  minArgs: 0,
  maxArgs: 1,
  expectedArgs: '[num1]',
  options: [
    {
      name: 'enabled',
      description: 'whether or not to enable the bot for this user',
      required: false,
      type: 'BOOLEAN'
    }
  ],

  callback: async command => {
    msg.log.command();

    let disableUser: boolean | undefined;
    if (command.args.length === 0) {
      // use var to make variable accessible down below
      disableUser = undefined;
    } else if (command.args[0]) {
      disableUser = command.args[0] === 'true';
    }

    const res: db.UserConfigType | null = await db.UserConfig.findOne({ userID: command.user.id });
    if (!res) {
      await db.checkUser(command.user);
      await command.interaction.reply({ embeds: [msg.errorEmbed()] });
      return;
    }
    if (disableUser === undefined) {
      command.interaction.reply({ embeds: [msg.userStatus(res.autoRole)] });
    } else {
      await db.UserConfig.findOneAndUpdate({ userID: command.user.id }, { autoRole: disableUser });
      command.interaction.reply({ embeds: [msg.modifiedAutoRole(disableUser)] });
    }
  }
} as ICommand;
