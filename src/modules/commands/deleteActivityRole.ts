import { db, ActivityRoles } from '../db';
import { log } from '../messages';
//mention that no roles are removed and maybe there is an extra command

import { Command } from '../commandHandler';
import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  CommandInteraction,
  EmbedBuilder,
  PermissionsBitField
} from 'discord.js';

import config from '../../../config';

export default {
  name: 'deleteactivityrole',
  description:
    'Deletes an activity role from your guild. Provide the activity or the role, or both.',
  requiredPermissions: [PermissionsBitField.Flags.ManageRoles],

  testOnly: config.debug,
  guildOnly: true,

  options: [
    {
      name: 'activity',
      description: 'the activity roles with this name will be deleted',
      required: false,
      type: ApplicationCommandOptionType.String
    },
    {
      name: 'role',
      description: 'the activity roles of this role will be deleted',
      required: false,
      type: ApplicationCommandOptionType.Role
    },
    {
      name: 'all',
      description: 'ATTENTION: DELETES ALL ACTIVITY ROLES',
      required: false,
      type: ApplicationCommandOptionType.Boolean
    }
  ],

  callback: async interaction => {
    const role = interaction.options.get('role')?.role;
    const activity = interaction.options.get('activity')?.value as string | undefined;
    const all = interaction.options.get('all')?.value as boolean | undefined;

    if (all) {
      interaction.reply({
        content: 'Are you sure you want to delete all activity roles?',
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId('deleteactivityrole:confirm')
              .setLabel('Yes')
              .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
              .setCustomId('deleteactivityrole:cancel')
              .setLabel('No')
              .setStyle(ButtonStyle.Secondary)
          )
        ],
        ephemeral: true
      });
      interaction.channel
        ?.createMessageComponentCollector({
          filter: btnInt => interaction.user.id === btnInt.user.id,
          max: 1,
          time: 1000 * 60
        })
        .on('collect', async (int: ButtonInteraction) => {
          switch (int.customId) {
            case 'deleteactivityrole:confirm':
              process(
                int,
                db.prepare('SELECT * FROM activityRoles WHERE guildID = ?').all(interaction.guildId)
              );
              db.prepare('DELETE FROM activityRoles WHERE guildID = ?').run(interaction.guildId);
              break;
            case 'deleteactivityrole:cancel':
              int.update({ content: 'Cancelled', components: [] });
              break;
          }
        });
    } else if (!role && !activity) {
      return interaction.reply({
        content:
          'You need to provide a role or an activity. If you provide a role, all activity roles for that role will be deleted. If you provide an activity, all activity roles with that name will be deleted.\nIf you provide both, all activity roles with that name for that role will be deleted.',
        ephemeral: true
      });
    } else if (role && !activity) {
      process(
        interaction,
        db
          .prepare('SELECT * FROM activityRoles WHERE guildID = ? AND roleID = ?')
          .all(interaction.guildId, role.id)
      );
      db.prepare('DELETE FROM activityRoles WHERE guildID = ? AND roleID = ?').run(
        interaction.guildId,
        role.id
      );
    } else if (!role && activity) {
      process(
        interaction,
        db
          .prepare('SELECT * FROM activityRoles WHERE guildID = ? AND activityName = ?')
          .all(interaction.guildId, activity)
      );
      db.prepare('DELETE FROM activityRoles WHERE guildID = ? AND activityName = ?').run(
        interaction.guildId,
        activity
      );
    } else if (role && activity) {
      process(
        interaction,
        db
          .prepare(
            'SELECT * FROM activityRoles WHERE guildID = ? AND roleID = ? AND activityName = ?'
          )
          .all(interaction.guildId, role.id, activity)
      );
      db.prepare(
        'DELETE FROM activityRoles WHERE guildID = ? AND roleID = ? AND activityName = ?'
      ).run(interaction.guildId, role.id, activity);
    }
  }
} as Command;

function process(interaction: CommandInteraction | ButtonInteraction, deleted: ActivityRoles[]) {
  if (deleted.length > 0) {
    const embeds = [
      // new EmbedBuilder().setTitle('Deleted Activity Roles:').setColor(config.botColor)
    ];
    embeds.push(
      ...deleted.map(activityRole => {
        return new EmbedBuilder()
          .addFields(
            { name: 'Activity', value: activityRole.activityName, inline: true },
            { name: 'Role', value: `<@&${activityRole.roleID}>`, inline: true },
            {
              name: 'Exact Activity Name',
              value: activityRole.exactActivityName ? 'Yes' : 'No',
              inline: true
            },
            { name: 'Live', value: activityRole.live ? 'Yes' : 'No', inline: true }
          )
          .setColor(config.botColor);
      })
    );
    if (interaction instanceof CommandInteraction)
      interaction.reply({ content: 'Deleted Activity Roles:', embeds: embeds, ephemeral: true });
    else interaction.update({ content: 'Deleted Activity Roles:', embeds: embeds, components: [] });
    deleted.forEach(activityRole => {
      log.info(
        `Activity role removed: in guild ${interaction.guild?.name} (${interaction.guildId}) role: ${activityRole.roleID} activityName: ${activityRole.activityName}, exactActivityName: ${activityRole.exactActivityName}, live mode: ${activityRole.live}`
      );
    });
  } else {
    if (interaction instanceof CommandInteraction)
      interaction.reply({ content: 'No activity roles were deleted.', ephemeral: true });
    else interaction.update({ content: 'No activity roles were deleted.', components: [] });
  }
}
