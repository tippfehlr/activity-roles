//mention that no roles are removed and maybe there is an extra command

import { ICommand } from 'wokcommands';
import Discord from 'discord.js';

import config from '../../../config';
import msg from '../messages';
import * as db from '../db';

export default {
  name: 'deleteAllActivities',
  category: 'User Configuration',
  description: 'Removes all activities from your account.',

  slash: true,
  testOnly: config.debug,

  callback: async command => {
    msg.log.command();

    const res = await db.UserData.find({ userID: command.user?.id });
    if (!res.length) {
      command.interaction.reply({ content: msg.noActivities() });
      return;
    }

    await command.interaction.reply({
      embeds: [msg.removeAllActivities()],
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
          db.UserData.deleteMany({ userID: command.user?.id }).then(res => {
            int.update({ embeds: [msg.removedActivitiesCount(res.deletedCount)], components: [] });
          });

          break;
        case 'cancel':
          int.update({ embeds: [msg.cancelled()], components: [] });
          break;
      }
    });
  }
} as ICommand;
