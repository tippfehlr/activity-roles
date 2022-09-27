import { db, UserData } from './../db';
//mention that no roles are removed and maybe there is an extra command

import { Command } from '../commandHandler';
import Discord from 'discord.js';

import config from '../../../config';
import msg from '../messages';

export default {
  name: 'deleteallactivities',
  category: 'User Configuration',
  description: 'Removes all activities from your account.',

  testOnly: config.debug,

  callback: async interaction => {
    await interaction.deferReply({ ephemeral: true });

    const res = db
      .prepare('SELECT * FROM userData WHERE userID = ?')
      .all(interaction.user.id) as UserData[];
    if (!res.length) {
      interaction.editReply({ content: msg.noActivities() });
      return;
    }

    await interaction.editReply({
      embeds: [msg.removeAllActivities()],
      components: [msg.removeButtonRow()]
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
          db.prepare('DELETE FROM userData WHERE userID = ?').run(interaction.user.id);
          buttonInteraction.update({
            embeds: [msg.removedAllActivities()],
            components: []
          });
          break;
        case 'cancel':
          buttonInteraction.update({ embeds: [msg.cancelled()], components: [] });
          break;
      }
    });
  }
} as Command;
