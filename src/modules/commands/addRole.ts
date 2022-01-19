import { ICommand } from 'wokcommands'
import Discord from 'discord.js';
import { ApplicationCommandOptionTypes as OptionType } from 'discord.js/typings/enums';

import config from '../../../config';
import messages from '../messages';
import db from '../db';

export default {
  names: 'addRole',
  category: 'Configuration',
  description: 'Adds a gamerole to your guild.',
  requiredPermissions: ['ADMINISTRATOR'],

  slash: true,
  testOnly: true,

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
      description: 'The second number',
      required: true,
      type: OptionType.STRING
    },
    {
      name: 'excactactivityname',
      description: 'If the activityname can be a part of an activity (for example \'Chrome\' at \'Google Chrome\')',
      required: true,
      type: OptionType.BOOLEAN
    }
  ],


  callback: async command => {
    messages.log.activity();

    const [roleID, activityName] = command.args;
    const exactActivityName = command.args[2] === 'true' ? true : false;
    const role = command?.guild?.roles.cache.get(roleID);
    if (!role) {  //not sure if it's possible to enter an invalid role but to be safe //actually it is possible to enter @everyone but I don't know id this protects from that //TODO: Possible bug
      return ':x: That role does not exist! :x:';
    } else {
      if (await db.GuildData.findOne({ guildID: command?.guild?.id.toString(), roleID: roleID, activityName: activityName })) {
        return ':x: That GameRole already exists in this guild! Edit it with `/editRole`. :x:';
      } else {
        new db.GuildData({
          guildID: command?.guild?.id.toString(),
          roleID: roleID,
          activityName: activityName,
          exactActivityName: exactActivityName
        }).save();
        if (command.guild) db.checkAllRoles(command.guild);

        messages.log.addGameRole(command?.guild?.name ?? messages.errorMessage, command?.guild?.id ?? messages.errorMessage, role.name, roleID, activityName, exactActivityName);
        return new Discord.MessageEmbed()
          .setColor(config.embedColor)
          .setTitle('Set!')
          .addField('Role:', '<@&' + role.id + '>')
          .addField('Activity:', activityName)
          .addField('has to be exact:', exactActivityName.toString());
      }
    }
  },
} as ICommand