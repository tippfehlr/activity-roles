import { DBActivityRole, getLang, prepare } from '../db';
import { discordTranslations, log, __ } from '../messages';
import config from '../config';
import { Command } from '../commandHandler';

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChannelType,
  CommandInteraction,
  ComponentType,
  EmbedBuilder,
  PermissionsBitField,
  SlashCommandBuilder,
} from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('deleteactivityrole')
    .setDescription(
      'Deletes an activity role from your guild. Provide the activity or the role, or both.',
    )
    .setDescriptionLocalizations(
      discordTranslations(
        'Deletes an activity role from your guild. Provide the activity or the role, or both.',
      ),
    )
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles)
    .setDMPermission(true)
    .addStringOption(option =>
      option
        .setName('activity')
        .setDescription('the activity roles with this name will be deleted')
        .setDescriptionLocalizations(
          discordTranslations('the activity roles with this name will be deleted'),
        )
        .setRequired(false),
    )
    .addRoleOption(option =>
      option
        .setName('role')
        .setDescription('the activity roles of this role will be deleted')
        .setDescriptionLocalizations(
          discordTranslations('the activity roles of this role will be deleted'),
        )
        .setRequired(false),
    )
    .addBooleanOption(option =>
      option
        .setName('all')
        .setDescription('ATTENTION: DELETES ALL ACTIVITY ROLES')
        .setDescriptionLocalizations(discordTranslations('ATTENTION: DELETES ALL ACTIVITY ROLES'))
        .setRequired(false),
    ),

  execute: async interaction => {
    const locale = getLang(interaction);
    if (!interaction.channel) return;
    if (interaction.channel.type !== ChannelType.GuildText) {
      await interaction.reply(
        __({ phrase: 'This command can only be used in text channels.', locale }),
      );
      return;
    }

    const role = interaction.options.get('role')?.role;
    const activity = interaction.options.get('activity')?.value as string | undefined;
    const all = interaction.options.get('all')?.value as boolean | undefined;

    if (all) {
      interaction.reply({
        content: __({ phrase: 'Are you sure you want to delete all activity roles?', locale }),
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId('deleteactivityrole:confirm')
              .setLabel(__({ phrase: 'Yes', locale }))
              .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
              .setCustomId('deleteactivityrole:cancel')
              .setLabel(__({ phrase: 'No', locale }))
              .setStyle(ButtonStyle.Secondary),
          ),
        ],
        ephemeral: true,
      });
      interaction.channel
        .createMessageComponentCollector({
          componentType: ComponentType.StringSelect,
          filter: btnInt => interaction.user.id === btnInt.user.id,
          max: 1,
          time: 1000 * 60,
        })
        .on('collect', async (int: ButtonInteraction) => {
          switch (int.customId) {
            case 'deleteactivityrole:confirm':
              process(
                int,
                prepare('SELECT * FROM activityRoles WHERE guildID = ?').all(
                  interaction.guildId,
                ) as DBActivityRole[],
                locale,
              );
              prepare('DELETE FROM activityRoles WHERE guildID = ?').run(interaction.guildId);
              break;
            case 'deleteactivityrole:cancel':
              int.update({ content: __({ phrase: 'Cancelled', locale }), components: [] });
              break;
          }
        });
    } else if (!role && !activity) {
      return interaction.reply({
        content: __({
          phrase:
            'You need to provide a role or an activity. If you provide a role, all activity roles for that role will be deleted. If you provide an activity, all activity roles with that name will be deleted.\nIf you provide both, all activity roles with that name for that role will be deleted.',
          locale,
        }),
        ephemeral: true,
      });
    } else if (role && !activity) {
      process(
        interaction,
        prepare('SELECT * FROM activityRoles WHERE guildID = ? AND roleID = ?').all(
          interaction.guildId,
          role.id,
        ) as DBActivityRole[],
        locale,
      );
      prepare('DELETE FROM activityRoles WHERE guildID = ? AND roleID = ?').run(
        interaction.guildId,
        role.id,
      );
    } else if (!role && activity) {
      process(
        interaction,
        prepare('SELECT * FROM activityRoles WHERE guildID = ? AND activityName = ?').all(
          interaction.guildId,
          activity,
        ) as DBActivityRole[],
        locale,
      );
      prepare('DELETE FROM activityRoles WHERE guildID = ? AND activityName = ?').run(
        interaction.guildId,
        activity,
      );
    } else if (role && activity) {
      process(
        interaction,
        prepare(
          'SELECT * FROM activityRoles WHERE guildID = ? AND roleID = ? AND activityName = ?',
        ).all(interaction.guildId, role.id, activity) as DBActivityRole[],
        locale,
      );
      prepare(
        'DELETE FROM activityRoles WHERE guildID = ? AND roleID = ? AND activityName = ?',
      ).run(interaction.guildId, role.id, activity);
    }
  },
} as Command;

function process(
  interaction: CommandInteraction | ButtonInteraction,
  deleted: DBActivityRole[],
  locale: string,
) {
  if (deleted.length > 0) {
    const embeds = [
      // new EmbedBuilder().setTitle('Deleted Activity Roles:').setColor(config.COLOR)
    ];
    embeds.push(
      ...deleted.map(activityRole => {
        return new EmbedBuilder()
          .addFields(
            {
              name: __({ phrase: 'Activity', locale }),
              value: activityRole.activityName,
              inline: true,
            },
            {
              name: __({ phrase: 'Role', locale }),
              value: `<@&${activityRole.roleID}>`,
              inline: true,
            },
            {
              name: __({ phrase: 'Exact Activity Name', locale }),
              value: activityRole.exactActivityName
                ? __({ phrase: 'Yes', locale })
                : __({ phrase: 'No', locale }),
              inline: true,
            },
            {
              name: __({ phrase: 'Live', locale }),
              value: activityRole.live
                ? __({ phrase: 'Yes', locale })
                : __({ phrase: 'No', locale }),
              inline: true,
            },
          )
          .setColor(config.COLOR);
      }),
    );
    if (interaction instanceof CommandInteraction)
      interaction.reply({
        content: __({ phrase: 'Deleted Activity Roles:', locale }),
        embeds: embeds,
        ephemeral: true,
      });
    else
      interaction.update({
        content: __({ phrase: 'Deleted Activity Roles:', locale }),
        embeds: embeds,
        components: [],
      });
    deleted.forEach(activityRole => {
      log.info(
        `Activity role removed: in guild ${interaction.guild?.name} (${interaction.guildId}) role: ${activityRole.roleID} activityName: ${activityRole.activityName}, exactActivityName: ${activityRole.exactActivityName}, live mode: ${activityRole.live}`,
      );
    });
  } else {
    if (interaction instanceof CommandInteraction)
      interaction.reply({
        content: __({ phrase: 'No activity roles were deleted.', locale }),
        ephemeral: true,
      });
    else
      interaction.update({
        content: __({ phrase: 'No activity roles were deleted.', locale }),
        components: [],
      });
  }
}
