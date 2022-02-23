import { ICommand } from 'wokcommands'
import { ApplicationCommandOptionTypes as OptionType } from 'discord.js/typings/enums';

import config from '../../../config';
import msg from '../messages';
import * as db from '../db';
export default {
  names: 'addRole',
  category: 'Configuration',
  description: 'Adds a gamerole to your guild.',
  requiredPermissions: ['ADMINISTRATOR'],

  slash: true,
  testOnly: config.debug,

  minArgs: 2,
  expectedArgs: '<num1> <num2>',
  options: [
    {
      name: 'role',
      description: 'the role I assign',
      required: true,
      type: OptionType.ROLE
    },
    {
      name: 'activityname',
      description: 'The name of the discord presence I look for',
      required: true,
      type: OptionType.STRING
    },
    {
      name: 'excactactivityname',
      description: 'If the activity name can be a part of a discord presence',
      required: true,
      type: OptionType.BOOLEAN
    }
  ],


  callback: async command => {
    msg.log.activity();

    const [roleID, activityName] = command.args;
    if (activityName.length > 1024) return msg.inputTooLong();
    const exactActivityName = command.args[2] === 'true';
    const role = command?.guild?.roles.cache.get(roleID);
    if (!role) {
      command.interaction.reply({ content: msg.roleDoesNotExist(), ephemeral: true });
      return;
    }
    if(role.name === '@everyone'){
      command.interaction.reply({ content: msg.cantUseEveryone(), ephemeral: true });
      return;
    }
    if (await db.GuildData.findOne({ guildID: command?.guild?.id.toString(), roleID: roleID, activityName: activityName })) {
      command.interaction.reply({ content: msg.gameRoleExists(), ephemeral: true });
      return;
    } else {
      new db.GuildData({
        guildID: command?.guild?.id.toString(),
        roleID: roleID,
        activityName: activityName,
        exactActivityName: exactActivityName
      }).save();
      if (command.guild) db.checkAllRoles(command.guild);
      msg.log.addGameRole(String(command?.guild?.name), String(command?.guild?.id), role.name, roleID, activityName, exactActivityName);
      command.interaction.reply({ embeds: [msg.setNewGameRole(role.id, activityName, exactActivityName)], ephemeral: true });
    }
  }
} as ICommand