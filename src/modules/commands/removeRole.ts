//mention that no roles are removed and maybe there is an extra command

import { ICommand } from 'wokcommands';
import Discord from 'discord.js';
import { ApplicationCommandOptionTypes as OptionType } from 'discord.js/typings/enums';

import config from '../../../config';
import msg from '../messages';
import * as db from '../db';

export default {
  names: 'deleteRole',
  category: 'Configuration',
  description: 'Deletes an activity role from your guild.',
  requiredPermissions: ['ADMINISTRATOR'],

  slash: true,
  testOnly: config.debug,

  minArgs: 2,
  expectedArgs: '<arg1> <arg2> [arg3]',
  options: [
    {
      name: 'role',
      description: 'the role I used to assign',
      required: true,
      type: OptionType.ROLE
    },
    {
      name: 'activityname',
      description: 'The name of the discord presence I was looking for',
      required: true,
      type: OptionType.STRING
    },
    {
      name: 'removemembers',
      description: 'If I should remove the role from accounts who got it from me.',
      required: false,
      type: OptionType.BOOLEAN
    }
  ],

  callback: async command => {
    msg.log.command();

    const [roleID, activityName] = command.args;
    const data = await db.GuildData.findOne({
      guildID: command?.guild?.id.toString(),
      roleID: roleID
    });
    if (!data) {
      command.interaction.reply({
        content: msg.activityRoleDoesNotExist(),
        ephemeral: true
      });
      return;
    }

    await command.interaction.reply({
      embeds: [msg.removeActivityRoleQ(activityName, roleID, data.exactActivityName)],
      components: [msg.removeButtonRow()],
      ephemeral: true
    });

    const filter = (btnInt: Discord.MessageComponentInteraction<'cached'>) => {
      return command.interaction.user.id === btnInt.user.id;
    };

    const collector = command.channel.createMessageComponentCollector({
      filter,
      max: 1,
      time: 1000 * 60
    });

    collector.on('collect', (int: Discord.ButtonInteraction) => {
      switch (int.customId) {
        case 'remove':
          db.GuildData.deleteOne({
            guildID: command?.guild?.id.toString(),
            roleID: roleID
          }).then(res => {
            if (res.deletedCount > 0) {
              int.update({ embeds: [msg.removed()], components: [] });
            } else {
              int.update({ embeds: [msg.errorEmbed()], components: [] });
            }
          });
          break;
        case 'cancel':
          int.update({ embeds: [msg.cancelled()], components: [] });
          break;
      }
    });
  }
} as ICommand;
