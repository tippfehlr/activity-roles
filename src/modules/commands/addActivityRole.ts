import { Command } from '../commandHandler';

import config from '../../../config';
import msg from '../messages';
import * as db from '../db';
export default {
  name: 'addactivityrole',
  category: 'Configuration',
  description: 'Adds an activity role to your guild.',
  requiredPermissions: ['MANAGE_ROLES'],

  testOnly: config.debug,
  guildOnly: true,

  options: [
    {
      name: 'role',
      description: 'the role I assign',
      required: true,
      type: 'ROLE'
    },
    {
      name: 'activity_name',
      description: 'The name of the discord presence I look for',
      required: true,
      type: 'STRING'
    },
    {
      name: 'exact_activity_name',
      description: 'If the activity name can be a part of a discord presence',
      required: true,
      type: 'BOOLEAN'
    },
    {
      name: 'live',
      description:
        "If the role should be removed when the activity isn't in the users presence anymore.",
      required: true,
      type: 'BOOLEAN'
    }
  ],
  callback: async interaction => {
    await interaction.deferReply({ ephemeral: true });
    msg.log.command();
    const activityName = interaction.options.getString('activity_name');
    if (!activityName) return;
    if (activityName.length > 1024) return msg.inputTooLong();
    const exactActivityName = interaction.options.getBoolean('exact_activity_name');
    if (exactActivityName === null) return;
    const live = interaction.options.getBoolean('live');
    if (live === null) return;
    const role = interaction.options.getRole('role');
    if (!role) {
      return { content: msg.roleDoesNotExist(), ephemeral: true };
    }
    if (role.name === '@everyone') {
      interaction.editReply({ content: msg.cantUseEveryone() });
      return;
    }
    if (
      await db.GuildData.findOne({
        guildID: interaction.guild!.id,
        roleID: role.id,
        activityName: activityName
      })
    ) {
      interaction.editReply({
        content: msg.activityRoleExists()
      });
      return;
    } else {
      new db.GuildData({
        guildID: interaction?.guild!.id,
        roleID: role.id,
        activityName: activityName,
        exactActivityName: exactActivityName,
        live: live
      }).save();
      if (interaction.guild) db.checkAllRoles(interaction.guild);
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
      interaction.editReply({
        embeds: [msg.setNewActivityRole(role.id, activityName, exactActivityName, live)]
      });
    }
  }
} as Command;
