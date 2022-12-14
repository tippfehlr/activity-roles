import { __h_dc } from './../messages';
import {
  Role,
  CommandInteraction,
  PermissionsBitField,
  SelectMenuInteraction,
  InteractionType,
  EmbedBuilder,
  ActionRowBuilder,
  SelectMenuBuilder,
  APIRole,
  SlashCommandBuilder,
  ComponentType,
  Colors,
  Locale
} from 'discord.js';

import { Command } from '../commandHandler';
import config from '../../../config';
import { log, __ } from '../messages';
import { db, getLang } from '../db';

export default {
  data: new SlashCommandBuilder()
    .setName('addactivityrole')
    .setNameLocalizations(__h_dc('addactivityrole'))
    .setDescription('Adds an activity role to your guild.')
    .setDescriptionLocalizations(__h_dc('Adds an activity role to your guild.'))
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles)
    .setDMPermission(false)
    .addStringOption(option =>
      option
        .setName('activity')
        .setNameLocalizations(__h_dc('activity'))
        .setDescription('the name of the discord activity')
        .setDescriptionLocalizations(__h_dc('the name of the discord activity'))
        .setRequired(true)
    )
    .addRoleOption(option =>
      option
        .setName('role')
        .setNameLocalizations(__h_dc('role'))
        .setDescription(
          'If not provided, the bot will look for roles with the same name or create a new one'
        )
        .setDescriptionLocalizations(
          __h_dc(
            'If not provided, the bot will look for roles with the same name or create a new one'
          )
        )
        .setRequired(false)
    )
    .addBooleanOption(option =>
      option
        .setName('exact_activity_name')
        .setNameLocalizations(__h_dc('exact_activity_name'))
        .setDescription(
          "If false, the activity name 'Chrome' would also trigger for 'Google Chrome'"
        )
        .setDescriptionLocalizations(
          __h_dc("If false, the activity name 'Chrome' would also trigger for 'Google Chrome'")
        )
        .setRequired(false)
    )
    .addBooleanOption(option =>
      option
        .setName('live')
        .setNameLocalizations(__h_dc('live'))
        .setDescriptionLocalizations(__h_dc('live'))
        .setDescription('Should the bot remove the role again when the activity stops?')
        .setDescriptionLocalizations(
          __h_dc('Should the bot remove the role again when the activity stops?')
        )
        .setRequired(false)
    ),
  execute: async interaction => {
    const locale = getLang(interaction);

    const activityName = interaction.options.get('activity', true)?.value as string;
    if (activityName.length > 1024) {
      await interaction.reply({
        content: __({
          phrase: 'The activity name is too long! Maximum is 1024 characters.',
          locale
        }),
        ephemeral: true
      });
      return;
    }
    const exactActivityName: boolean =
      (interaction.options.get('exact_activity_name', false)?.value as boolean | undefined) ??
      false;
    const live: boolean =
      (interaction.options.get('live', false)?.value as boolean | undefined) ?? false;
    let role = interaction.options.get('role', false)?.role;
    if (!role) {
      // role not provided
      const possibleRoles = interaction.guild?.roles.cache.filter(role => {
        return role.name.toLowerCase().includes(activityName.toLowerCase());
      });
      if (!possibleRoles || possibleRoles.size === 0) {
        // create role
        role = await createRole(interaction, activityName);
        process(interaction, role, activityName, exactActivityName, live, locale);
      } else if (possibleRoles.size === 1) {
        // use role
        role = possibleRoles.first()!;
        process(interaction, role, activityName, exactActivityName, live, locale);
      } else {
        // select role
        const row = new ActionRowBuilder<SelectMenuBuilder>().addComponents(
          new SelectMenuBuilder()
            .setCustomId('addactivityrole:roleSelector')
            .setPlaceholder(__({ phrase: "Please select a role for '%s'", locale }, activityName))
            .addOptions([
              ...possibleRoles.map(role => {
                return {
                  label: role.name,
                  description: role.id,
                  value: role.id
                };
              }),
              {
                label: __({ phrase: 'Create %s', locale }, activityName),
                description: __(
                  { phrase: "Create a new role with the name '%s'", locale },
                  activityName
                ),
                value: 'create'
              }
            ])
        );
        interaction.channel
          ?.createMessageComponentCollector({
            componentType: ComponentType.SelectMenu,
            filter: componentInteraction =>
              componentInteraction.customId === 'addactivityrole:roleSelector',
            time: 60000,
            max: 1
          })
          .once('collect', async selectMenuInteraction => {
            if (selectMenuInteraction.user.id !== interaction.user.id) return;
            if (!selectMenuInteraction.isSelectMenu()) return;
            if (selectMenuInteraction.customId !== 'addactivityrole:roleSelector') return;
            if (selectMenuInteraction.values[0] === 'create') {
              role = await createRole(interaction, activityName);
            } else {
              role =
                selectMenuInteraction.guild!.roles.cache.get(selectMenuInteraction.values[0]) ||
                null;
            }
            if (role) {
              process(selectMenuInteraction, role, activityName, exactActivityName, live, locale);
            }
          });
        interaction.reply({
          components: [row],
          ephemeral: true
        });
      }
    } else {
      process(interaction, role, activityName, exactActivityName, live, locale);
    }
  }
} as Command;

async function createRole(interaction: CommandInteraction, activityName: string) {
  return await interaction.guild!.roles.create({
    name: activityName,
    color: config.botColor,
    mentionable: true
  });
}

function reply(
  interaction: CommandInteraction | SelectMenuInteraction,
  content?: string,
  embeds?: EmbedBuilder[]
) {
  if (interaction.type === InteractionType.ApplicationCommand) {
    interaction.reply({ content, embeds, ephemeral: true });
  } else if (interaction.isSelectMenu()) {
    interaction.update({ content, embeds, components: [] });
  }
}

function process(
  interaction: CommandInteraction | SelectMenuInteraction,
  role: Role | APIRole,
  activityName: string,
  exactActivityName: boolean,
  live: boolean,
  locale: Locale
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
    reply(interaction, undefined, [
      new EmbedBuilder()
        .setColor(Colors.Red)
        .setDescription(
          __({
            phrase:
              'To assign roles, my highest role needs to be higher than the role I am assigning.\nMove any of my roles higher than the role I should manage.',
            locale
          })
        )
        .addFields(
          {
            name: __({ phrase: 'My highest role:', locale }),
            value:
              `<@&${interaction.guild.members.me.roles.highest.id}> ` +
              __(
                { phrase: '(position #%s)', locale },
                interaction.guild.members.me.roles.highest.position.toString()
              )
          },
          {
            name: __({ phrase: 'the activity role:', locale }),
            value:
              `<@&${role.id}> ` + __({ phrase: '(position #%s)', locale }, role.position.toString())
          }
        )
    ]);
    return;
  }
  if (
    db
      .prepare('SELECT * FROM activityRoles WHERE guildID = ? AND roleID = ? AND activityName = ?')
      .get(interaction.guild!.id, role.id, activityName)
  ) {
    reply(
      interaction,
      __({ phrase: ':x: That activity role already exists in this guild! :x:', locale })
    );
    return;
  } else {
    db.prepare('INSERT INTO activityRoles VALUES (?, ?, ?, ?, ?)').run(
      interaction.guild!.id,
      activityName,
      role.id,
      Number(exactActivityName),
      Number(live)
    );
    log.info(
      `New activity role added: in guild ${interaction.guild.name} (${interaction.guild.id}) role: ${role.name} (${role.id}) activityName: ${activityName}, exactActivityName: ${exactActivityName}, live mode: ${live}`
    );
    reply(interaction, undefined, [
      new EmbedBuilder()
        .setColor(config.botColor)
        .setTitle(__({ phrase: 'Success!', locale }))
        .addFields(
          { name: __({ phrase: 'activity', locale }), value: activityName },
          { name: __({ phrase: 'role', locale }), value: `<@&${role.id}>` },
          {
            name: __({ phrase: 'exact activity name', locale }),
            value: exactActivityName ? __('Yes') : __('No')
          },
          {
            name: __({ phrase: 'live', locale }),
            value: live ? __({ phrase: 'Yes', locale }) : __({ phrase: 'No', locale })
          }
        )
    ]);
  }
}
