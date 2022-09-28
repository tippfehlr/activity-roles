import {
  MessageActionRow,
  MessageSelectMenu,
  Role,
  CommandInteraction,
  Interaction,
  MessageEmbed
} from 'discord.js';

import { Command } from '../commandHandler';
import config from '../../../config';
import msg from '../messages';
import { checkAllRoles, db } from '../db';

export default {
  name: 'addactivityrole',
  category: 'Configuration',
  description: 'Adds an activity role to your guild.',
  requiredPermissions: ['MANAGE_ROLES'],

  testOnly: config.debug,
  guildOnly: true,

  options: [
    {
      name: 'activity',
      description: 'the name of the discord presence',
      required: true,
      type: 'STRING'
    },
    {
      name: 'role',
      description: 'the role to assign',
      required: false,
      type: 'ROLE'
    },
    {
      name: 'exact_activity_name',
      description: 'If the activity name has to be exactly the name of the activity.',
      required: false,
      type: 'BOOLEAN'
    },
    {
      name: 'live',
      description: 'Should the user keep the role when the activity stops?',
      required: false,
      type: 'BOOLEAN'
    }
  ],
  callback: async interaction => {
    const activityName = interaction.options.getString('activity');
    if (!activityName) return;
    if (activityName.length > 1024) return msg.inputTooLong();
    const exactActivityName = interaction.options.getBoolean('exact_activity_name') || false;
    const live = interaction.options.getBoolean('live') || false;
    let role = interaction.options.getRole('role');
    if (role === null) {
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
        const row = new MessageActionRow().addComponents(
          new MessageSelectMenu()
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
            filter: interaction =>
              interaction.isSelectMenu() && interaction.customId === 'addactivityrole:roleSelector',
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

function reply(interaction: Interaction, content?: string, embeds?: MessageEmbed[]) {
  if (interaction.isApplicationCommand()) {
    interaction.reply({ content, embeds, ephemeral: true });
  } else if (interaction.isSelectMenu()) {
    interaction.update({ content, embeds, components: [] });
  }
}

function process(
  interaction: Interaction,
  role: Role,
  activityName: string,
  exactActivityName: boolean,
  live: boolean
) {
  if (!interaction.isApplicationCommand() && !interaction.isSelectMenu()) return;
  if (!role) reply(interaction, msg.roleDoesNotExist());
  if (role.name === '@everyone') {
    reply(interaction, msg.cantUseEveryone());
    return;
  }
  if (
    db
      .prepare('SELECT * FROM guildData WHERE guildID = ? AND roleID = ? AND activityName = ?')
      .get(interaction.guild!.id, role.id, activityName)
  ) {
    reply(interaction, msg.activityRoleExists());
    return;
  } else {
    db.prepare('INSERT INTO guildData VALUES (?, ?, ?, ?, ?)').run(
      interaction.guild!.id,
      activityName,
      role.id,
      Number(exactActivityName),
      Number(live)
    );
    if (interaction.guild) checkAllRoles(interaction.guild);
    msg.log.addRemoveActivityRole(
      String(interaction.guild!.name),
      String(interaction.guild!.id),
      role.name,
      role.id,
      activityName,
      exactActivityName,
      live,
      true
    );
    reply(interaction, undefined, [
      msg.setNewActivityRole(role.id, activityName, exactActivityName, live)
    ]);
  }
}
