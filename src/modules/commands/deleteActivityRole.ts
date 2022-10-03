import { db, ActivityRoles } from '../db';
//mention that no roles are removed and maybe there is an extra command

import { Command } from '../commandHandler';
import Discord, { ApplicationCommandOptionType, PermissionsBitField } from 'discord.js';

import config from '../../../config';
import msg from '../messages';

export default {
  name: 'deleteactivityrole',
  description: 'Deletes an activity role from your guild.',
  requiredPermissions: [PermissionsBitField.Flags.ManageRoles],

  testOnly: config.debug,
  guildOnly: true,

  options: [
    {
      name: 'role',
      description: 'the role I used to assign',
      required: true,
      type: ApplicationCommandOptionType.Role
    },
    {
      name: 'activity_name',
      description: 'The name of the discord presence I was looking for',
      required: true,
      type: ApplicationCommandOptionType.String
    }
  ],

  callback: async interaction => {
    const role = interaction.options.get('role')?.role;
    if (!role) return;
    const activityName = interaction.options.get('activity_name')?.value as string;

    const data: ActivityRoles | null = db
      .prepare('SELECT * FROM activityRoles WHERE guildID = ? AND roleID = ?')
      .get(interaction.guild!.id, role.id);

    if (!data) {
      interaction.reply({
        content: msg.activityRoleDoesNotExist()
      });
      return;
    }

    await interaction.reply({
      embeds: [
        msg.removeActivityRoleQ(
          activityName,
          role.id,
          Boolean(data.exactActivityName),
          Boolean(data.live)
        )
      ],
      components: [msg.removeButtonRow()]
    });

    const filter = (btnInt: Discord.MessageComponentInteraction<'cached'>) => {
      return interaction.user.id === btnInt.user.id;
    };

    interaction.channel
      ?.createMessageComponentCollector({
        filter,
        max: 1,
        time: 1000 * 60
      })
      .on('collect', async (int: Discord.ButtonInteraction) => {
        switch (int.customId) {
          case 'remove':
            db.prepare('DELETE FROM activityRoles WHERE guildID = ? AND roleID = ?').run(
              interaction.guild!.id,
              role.id
            );
            int.update({ embeds: [msg.removed()], components: [] });
            break;
          case 'cancel':
            int.update({ embeds: [msg.cancelled()], components: [] });
            break;
        }
      });
  }
} as Command;
