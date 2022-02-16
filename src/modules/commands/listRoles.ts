import { ICommand } from 'wokcommands'
import Discord from 'discord.js'

import config from '../../../config';
import msg from '../messages';
import * as db from '../db';

export default {
  names: 'listRoles',
  category: 'Information',
  description: 'Lists all game roles in your guild.',

  slash: true,
  testOnly: config.debug,

  callback: async command => {
    msg.log.activity();
    const embeds = msg.roleList(await db.GuildData.find({ guildID: command?.guild?.id }));
    if (embeds.length > 1) {
      let i = 0;
      await command.interaction.reply({ embeds: [embeds[0]], components: [msg.navigationButtonRow(i === 0, i === embeds.length - 1)] });

      const filter = (btnInt: any) => { return command.interaction.user.id === btnInt.user.id }

      const collector = command.channel.createMessageComponentCollector({ filter, time: 1000 * 60 * 3 });

      collector.on('collect', (int: Discord.ButtonInteraction) => {
        switch (int.customId) {
          case 'back':
            i--;
            int.update({ embeds: [embeds[i]], components: [msg.navigationButtonRow(i === 0, i === embeds.length - 1)] });
            break;
          case 'next':
            i++;
            int.update({ embeds: [embeds[i]], components: [msg.navigationButtonRow(i === 0, i === embeds.length - 1)] });
            break;
        }
      });

    } else {
      command.interaction.reply({ embeds: [embeds[0]] });
    }
  }
} as ICommand