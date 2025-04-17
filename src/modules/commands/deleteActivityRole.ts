// SPDX-License-Identifier: AGPL-3.0-only

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChannelType,
  CommandInteraction,
  ComponentType,
  InteractionContextType,
  MessageFlags,
  PermissionsBitField,
  SlashCommandBuilder,
} from 'discord.js';
import { Selectable } from 'kysely';

import { db, getLang } from '../db';
import { discordTranslations, log, __ } from '../messages';
import { Command } from '../commandHandler';
import { createActivityRolesTable } from '../activityRolesTable';
import { ActivityRoles } from '../db.types';
import { unlinkSync, writeFileSync } from 'fs';

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
    .setContexts([InteractionContextType.Guild])
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
        .setDescriptionLocalizations(
          discordTranslations(
            'deleteactivityrole->description->all:ATTENTION: DELETES ALL ACTIVITY ROLES',
          ),
        )
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
        content: __({
          phrase:
            'deleteActivityRoles->deleteAllConfirmation:Are you sure you want to delete all activity roles?',
          locale,
        }),
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
        flags: MessageFlags.Ephemeral,
      });
      interaction.channel
        .createMessageComponentCollector({
          componentType: ComponentType.Button,
          filter: btnInt => interaction.user.id === btnInt.user.id,
          max: 1,
          time: 1000 * 60,
        })
        .on('collect', async (int: ButtonInteraction) => {
          switch (int.customId) {
            case 'deleteactivityrole:confirm':
              process(
                int,
                await db
                  .selectFrom('activityRoles')
                  .selectAll()
                  .where('guildID', '=', interaction.guildId)
                  .execute(),
                locale,
              );
              db.deleteFrom('activityRoles').where('guildID', '=', interaction.guildId).execute();
              break;
            case 'deleteactivityrole:cancel':
              int.update({
                content: __({ phrase: 'Cancelled', locale }),
                components: [],
              });
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
        flags: MessageFlags.Ephemeral,
      });
    } else if (role && !activity) {
      process(
        interaction,
        await db
          .selectFrom('activityRoles')
          .selectAll()
          .where('guildID', '=', interaction.guildId)
          .where('roleID', '=', role.id)
          .execute(),
        locale,
      );
      db.deleteFrom('activityRoles')
        .where('guildID', '=', interaction.guildId)
        .where('roleID', '=', role.id)
        .execute();
    } else if (!role && activity) {
      process(
        interaction,
        await db
          .selectFrom('activityRoles')
          .selectAll()
          .where('guildID', '=', interaction.guildId)
          .where('activityName', '=', activity)
          .execute(),
        locale,
      );
      db.deleteFrom('activityRoles')
        .where('guildID', '=', interaction.guildId)
        .where('activityName', '=', activity)
        .execute();
    } else if (role && activity) {
      process(
        interaction,
        await db
          .selectFrom('activityRoles')
          .selectAll()
          .where('guildID', '=', interaction.guildId)
          .where('roleID', '=', role.id)
          .where('activityName', '=', activity)
          .execute(),
        locale,
      );
      db.deleteFrom('activityRoles')
        .where('guildID', '=', interaction.guildId)
        .where('roleID', '=', role.id)
        .where('activityName', '=', activity)
        .execute();
    }
  },
} as Command;

function process(
  interaction: CommandInteraction | ButtonInteraction,
  deleted: Selectable<ActivityRoles>[],
  locale: string,
) {
  if (!interaction.guild) return;
  const reply = async (content: string, files?: string[]) => {
    if (interaction instanceof CommandInteraction)
      await interaction.reply({
        content,
        files,
        flags: MessageFlags.Ephemeral,
      });
    else
      await interaction.update({
        content,
        files,
        components: [],
      });
    if (files) unlinkSync(files[0]);
  };

  if (deleted.length > 0) {
    const table = createActivityRolesTable({
      guild: interaction.guild,
      locale,
      activityRoles: deleted,
    });
    const filename = `listActivityRoles-${interaction.id.substring(0, 7)}.txt`;
    writeFileSync(filename, table);

    reply(
      __({
        phrase: 'deleteActivityRole->deletedRoles:Deleted Activity Roles:',
        locale,
      }),
      [filename],
    );

    deleted.forEach(activityRole => {
      log.info(
        `Activity role removed: in guild ${interaction.guild?.name} (${interaction.guildId}) role: ${activityRole.roleID} activityName: ${activityRole.activityName}, exact: ${activityRole.exact}, permanent: ${activityRole.permanent}`,
      );
    });
  } else {
    reply(
      __({
        phrase: 'deleteActivityRole->noRoleDeleted:No activity roles were deleted.',
        locale,
      }),
    );
  }
}
