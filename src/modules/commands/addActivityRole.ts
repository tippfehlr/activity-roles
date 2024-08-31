// SPDX-License-Identifier: AGPL-3.0-only

import { discordTranslations } from './../messages';
import {
  Role,
  CommandInteraction,
  PermissionsBitField,
  StringSelectMenuInteraction,
  InteractionType,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  APIRole,
  SlashCommandBuilder,
  ComponentType,
} from 'discord.js';

import { Command } from '../commandHandler';
import config from '../config';
import { log, __, i18n } from '../messages';
import { db, getLang } from '../db';

export default {
  data: new SlashCommandBuilder()
    .setName('addactivityrole')
    .setDescription('Adds an activity role to your guild.')
    .setDescriptionLocalizations(discordTranslations('Adds an activity role to your guild.'))
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles)
    .setDMPermission(false)
    .addStringOption(option =>
      option
        .setName('activity')
        .setDescription('the name of the discord activity')
        .setDescriptionLocalizations(discordTranslations('the name of the discord activity'))
        .setRequired(true),
    )
    .addRoleOption(option =>
      option
        .setName('role')
        .setDescription(
          'If not provided, the bot will look for roles with the same name or create a new one',
        )
        .setDescriptionLocalizations(
          discordTranslations(
            'If not provided, the bot will look for roles with the same name or create a new one',
          ),
        )
        .setRequired(false),
    )
    .addBooleanOption(option =>
      option
        .setName('exact_activity_name')
        .setDescription(
          "If false, the activity name 'Chrome' would also trigger for 'Google Chrome'",
        )
        .setDescriptionLocalizations(
          discordTranslations(
            "If false, the activity name 'Chrome' would also trigger for 'Google Chrome'",
          ),
        )
        .setRequired(false),
    )
    .addBooleanOption(option =>
      option
        .setName('permanent')
        .setDescription('the role will not be removed again if set to true')
        .setDescriptionLocalizations(
          discordTranslations('the role will not be removed again if set to true'),
        )
        .setRequired(false),
    )
    .addIntegerOption(option =>
      option
        .setName('remove_after_days')
        .setDescription(
          __({ phrase: 'addActivityRole->removeAfterDaysDescription', locale: 'en-US' }),
        )
        .setDescriptionLocalizations(
          discordTranslations('addActivityRole->removeAfterDaysDescription'),
        )
        .setRequired(false)
        .setMinValue(1),
    ),
  execute: async interaction => {
    const locale = getLang(interaction);
    if (!interaction.channel) return;

    const activityName = interaction.options.get('activity', true)?.value as string;
    if (activityName.length > 100) {
      await interaction.reply({
        content: __({ phrase: 'addActivityRole->activityNameTooLong', locale }, '100'),
        ephemeral: true,
      });
      return;
    }

    const exactActivityName =
      (interaction.options.get('exact_activity_name', false)?.value as boolean | undefined) ??
      false;
    const permanent =
      (interaction.options.get('permanent', false)?.value as boolean | undefined) ?? false;
    let role = interaction.options.get('role', false)?.role;
    const removeAfterDays = interaction.options.get('remove_after_days')?.value as
      | number
      | undefined;

    if (permanent === false && removeAfterDays !== undefined) {
      interaction.reply(__({ phrase: 'addActivityRole->removeAfterDaysButNotPermanent', locale }));
      return;
    }

    if (!role) {
      // role not provided
      const possibleRoles = interaction.guild?.roles.cache.filter(role => {
        return role.name.toLowerCase().includes(activityName.toLowerCase());
      });
      if (!possibleRoles || possibleRoles.size === 0) {
        // create role
        role = await createRole(interaction, activityName);
        process(
          interaction,
          role,
          activityName,
          exactActivityName,
          permanent,
          removeAfterDays,
          locale,
        );
      } else if (possibleRoles.size === 1) {
        // use role
        role = possibleRoles.first()!;
        process(
          interaction,
          role,
          activityName,
          exactActivityName,
          permanent,
          removeAfterDays,
          locale,
        );
      } else {
        // select role
        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('addactivityrole:roleSelector')
            .setPlaceholder(
              __(
                { phrase: "addActivityRole->roleselector:Please select a role for '%s'", locale },
                activityName,
              ),
            )
            .addOptions([
              ...possibleRoles.map(role => {
                return {
                  label: role.name,
                  description: role.id,
                  value: role.id,
                };
              }),
              {
                label: __(
                  { phrase: 'addActivityRole->createRole:Create %s', locale },
                  activityName,
                ),
                description: __(
                  {
                    phrase:
                      "addActivityRole->createRoleDescription:Create a new role with the name '%s'",
                    locale,
                  },
                  activityName,
                ),
                value: 'create',
              },
            ]),
        );
        interaction.channel
          .createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            filter: componentInteraction =>
              componentInteraction.customId === 'addactivityrole:roleSelector',
            time: 60000,
            max: 1,
          })
          .once('collect', async selectMenuInteraction => {
            if (selectMenuInteraction.user.id !== interaction.user.id) return;
            if (!selectMenuInteraction.isStringSelectMenu()) return;
            if (selectMenuInteraction.customId !== 'addactivityrole:roleSelector') return;
            if (selectMenuInteraction.values[0] === 'create') {
              role = await createRole(interaction, activityName);
            } else {
              role =
                selectMenuInteraction.guild!.roles.cache.get(selectMenuInteraction.values[0]) ||
                null;
            }
            if (role) {
              process(
                selectMenuInteraction,
                role,
                activityName,
                exactActivityName,
                permanent,
                removeAfterDays,
                locale,
              );
            }
          });
        interaction.reply({
          components: [row],
          ephemeral: true,
        });
      }
    } else {
      process(
        interaction,
        role,
        activityName,
        exactActivityName,
        permanent,
        removeAfterDays,
        locale,
      );
    }
  },
} as Command;

async function createRole(interaction: CommandInteraction, activityName: string) {
  return await interaction.guild!.roles.create({
    name: activityName,
    color: config.COLOR,
    mentionable: true,
  });
}

function reply(
  interaction: CommandInteraction | StringSelectMenuInteraction,
  content?: string,
  embeds?: EmbedBuilder[],
) {
  if (interaction.type === InteractionType.ApplicationCommand) {
    interaction.reply({ content, embeds, ephemeral: true });
  } else if (interaction.isStringSelectMenu()) {
    interaction.update({ content, embeds, components: [] });
  }
}

async function process(
  interaction: CommandInteraction | StringSelectMenuInteraction,
  role: Role | APIRole,
  activityName: string,
  exactActivityName: boolean,
  permanent: boolean,
  removeAfterDays: number | undefined,
  locale: string,
) {
  if (!role) reply(interaction, __({ phrase: ':x: That role does not exist! :x:', locale }));
  if (role.name === '@everyone') {
    reply(interaction, __({ phrase: "You can't use \\@everyone as an activity role.", locale }));
    return;
  }
  if (
    !interaction.guild?.members.me?.roles.highest?.position ||
    !interaction.guild.members.me.roles.highest.id
  )
    return;
  if (
    role.position &&
    interaction.guild.members.me?.roles.highest?.position &&
    role.position >= interaction.guild.members.me.roles.highest.position
  ) {
    reply(
      interaction,
      __({ phrase: 'presenceUpdate->roleHigherThanBotRole', locale }, `<@&${role.id}>`),
    );
    return;
  }
  if (
    await db
      .selectFrom('activityRoles')
      .selectAll()
      .where('guildID', '=', interaction.guildId)
      .where('activityName', '=', activityName)
      .where('roleID', '=', role.id)
      .executeTakeFirst()
  ) {
    reply(
      interaction,
      __({ phrase: ':x: That activity role already exists in this guild! :x:', locale }),
    );
    return;
  } else {
    db.insertInto('activityRoles')
      .values({
        guildID: interaction.guildId!,
        activityName,
        roleID: role.id,
        exactActivityName,
        permanent,
        removeAfterDays,
      })
      .execute();
    log.info(
      `New activity role added: in guild ${interaction.guild.name} (${interaction.guild.id}) role: ${role.name} (${role.id}) activityName: ${activityName}, exactActivityName: ${exactActivityName}, permanent: ${permanent}, removeAfterDays: ${removeAfterDays}`,
    );
    reply(interaction, undefined, [
      new EmbedBuilder()
        .setColor(config.COLOR)
        .setTitle(__({ phrase: 'Success!', locale }))
        .addFields(
          { name: __({ phrase: 'Activity', locale }), value: activityName },
          { name: __({ phrase: 'Role', locale }), value: `<@&${role.id}>` },
          {
            name: __({ phrase: 'Exact Activity Name', locale }),
            value: exactActivityName ? __('Yes') : __('No'),
          },
          {
            name: __({ phrase: 'Permanent', locale }),
            value: permanent ? __({ phrase: 'Yes', locale }) : __({ phrase: 'No', locale }),
          },
          {
            name: __({ phrase: 'remove after days', locale }),
            value: removeAfterDays
              ? i18n.__n({ singular: '%s day', plural: '%s days', locale, count: removeAfterDays })
              : '–',
          },
        ),
    ]);
  }
}
