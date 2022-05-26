//mention that no roles are removed and maybe there is an extra command

import { Command } from '../commandHandler';
import Discord from 'discord.js';

import config from '../../../config';
import msg from '../messages';
import * as db from '../db';

export default {
  name: 'deleteallactivities',
  category: 'User Configuration',
  description: 'Removes all activities from your account.',

  testOnly: config.debug,

  callback: async interaction => {
    msg.log.command();

    const res = await db.UserData.find({ userID: interaction.user?.id });
    if (!res.length) {
      interaction.reply({ content: msg.noActivities() });
      return;
    }

    await interaction.reply({
      embeds: [msg.removeAllActivities()],
      components: [msg.removeButtonRow()],
      ephemeral: true
    });

    const filter = (btnInt: Discord.MessageComponentInteraction<'cached'>) => {
      return interaction.user.id === btnInt.user.id;
    };

    const collector = interaction.channel?.createMessageComponentCollector({
      filter,
      max: 1,
      time: 1000 * 60
    });

    collector?.on('collect', (buttonInteraction: Discord.ButtonInteraction) => {
      switch (buttonInteraction.customId) {
        case 'remove':
          db.UserData.deleteMany({ userID: interaction.user?.id }).then(
            (res: { deletedCount: number }) => {
              buttonInteraction.update({
                embeds: [msg.removedActivitiesCount(res.deletedCount)],
                components: []
              });
            }
          );

          break;
        case 'cancel':
          buttonInteraction.update({ embeds: [msg.cancelled()], components: [] });
          break;
      }
    });
  }
} as Command;
