//mention that no roles are removed and maybe there is an extra command

import { Command } from '../commandHandler';
import Discord from 'discord.js';

import config from '../../../config';
import msg from '../messages';
import * as db from '../db';

export default {
  name: 'removeactivityrole',
  category: 'Configuration',
  description: 'Deletes an activity role from your guild.',
  requiredPermissions: ['MANAGE_ROLES'],

  testOnly: config.debug,
  guildOnly: true,

  options: [
    {
      name: 'role',
      description: 'the role I used to assign',
      required: true,
      type: 'ROLE'
    },
    {
      name: 'activity_name',
      description: 'The name of the discord presence I was looking for',
      required: true,
      type: 'STRING'
    }
  ],

  callback: async interaction => {
    msg.log.command();

    const role = interaction.options.getRole('role')!;
    const activityName = interaction.options.getString('activity_name')!;

    const data: db.GuildDataType | null = await db.GuildData.findOne({
      guildID: interaction?.guild!.id,
      roleID: role.id
    });
    if (!data) {
      interaction.reply({
        content: msg.activityRoleDoesNotExist(),
        ephemeral: true
      });
      return;
    }

    await interaction.reply({
      embeds: [msg.removeActivityRoleQ(activityName, role.id, data.exactActivityName, data.live)],
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

    collector?.on('collect', (int: Discord.ButtonInteraction) => {
      switch (int.customId) {
        case 'remove':
          db.GuildData.deleteOne({
            guildID: interaction?.guild!.id,
            roleID: role.id
          }).then((res: { deletedCount: number }) => {
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
} as Command;
