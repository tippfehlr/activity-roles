import { ICommand } from 'wokcommands'

import config from '../../../config';
import msg from '../messages';
import db from '../db';

export default {
  names: 'listRoles',
  category: 'Information',
  description: 'Lists all game roles in your guild.',

  slash: true,
  testOnly: config.debug,

  callback: async command => {
    msg.log.activity();

    command.interaction.reply({ embeds: msg.roleList(await db.GuildData.find({ guildID: command?.guild?.id })) });
  }
} as ICommand