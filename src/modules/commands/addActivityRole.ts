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
  ComponentType
} from 'discord.js';

import { Command } from '../commandHandler';
import config from '../../../config';
import msg, { log } from '../messages';
import { db } from '../db';

export default {
  data: new SlashCommandBuilder()
    .setName('addactivityrole')
    .setDescription('Adds an activity role to your guild.')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles)
    .setDMPermission(false)
    .addStringOption(option =>
      option
        .setName('activity')
        .setDescription('the name of the discord activity')
        .setRequired(true)
    )
    .addRoleOption(option =>
      option
        .setName('role')
        .setDescription(
          'If not provided, the bot will look for roles with the same name or create a new one'
        )
        .setRequired(false)
    )
    .addBooleanOption(option =>
      option
        .setName('exact_activity_name')
        .setDescription(
          "If false, the activity name 'Chrome' would also trigger for 'Google Chrome'"
        )
        .setRequired(false)
    )
    .addBooleanOption(option =>
      option
        .setName('live')
        .setDescription('Should the bot remove the role again when the activity stops?')
        .setRequired(false)
    ),
  execute: async interaction => {
    const activityName = interaction.options.get('activity', true)?.value as string;
    if (activityName.length > 1024) return msg.inputTooLong();
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
        process(interaction, role, activityName, exactActivityName, live);
      } else if (possibleRoles.size === 1) {
        // use role
        role = possibleRoles.first()!;
        process(interaction, role, activityName, exactActivityName, live);
      } else {
        // select role
        const row = new ActionRowBuilder<SelectMenuBuilder>().addComponents(
          new SelectMenuBuilder()
            .setCustomId('addactivityrole:roleSelector')
            .setPlaceholder(`Please select a role for '${activityName}'`)
            .addOptions([
              ...possibleRoles.map(role => {
                return {
                  label: role.name,
                  description: role.id,
                  value: role.id
                };
              }),
              {
                label: `Create '${activityName}'`,
                description: `Create a new role with the name '${activityName}'`,
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
            console.log('~ role', role);
            if (role) {
              process(selectMenuInteraction, role, activityName, exactActivityName, live);
            }
          });
        interaction.reply({
          components: [row],
          ephemeral: true
        });
      }
    } else {
      process(interaction, role, activityName, exactActivityName, live);
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
  live: boolean
) {
  if (!role) reply(interaction, msg.roleDoesNotExist());
  if (role.name === '@everyone') {
    reply(interaction, msg.cantUseEveryone());
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
      msg.roleTooLow(
        interaction.guild.members.me.roles.highest.id,
        interaction.guild.members.me.roles.highest.position,
        role.id,
        role.position
      )
    ]);
    return;
  }
  if (
    db
      .prepare('SELECT * FROM activityRoles WHERE guildID = ? AND roleID = ? AND activityName = ?')
      .get(interaction.guild!.id, role.id, activityName)
  ) {
    reply(interaction, msg.activityRoleExists());
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
      msg.setNewActivityRole(role.id, activityName, exactActivityName, live)
    ]);
  }
}
