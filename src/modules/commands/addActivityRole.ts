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
    msg.log.command();
    const roleID = interaction.options.getString('role')!;
    const activityName = interaction.options.getString('activity_name')!;
    if (activityName.length > 1024) return msg.inputTooLong();
    const exactActivityName = interaction.options.getBoolean('exact_activity_name')!;
    const live = interaction.options.getBoolean('live')!;
    const role = interaction.guild!.roles.cache.get(roleID);
    if (!role) {
      return { content: msg.roleDoesNotExist(), ephemeral: true };
    }
    if (role.name === '@everyone') {
      interaction.reply({ content: msg.cantUseEveryone(), ephemeral: true });
      return;
    }
    if (
      await db.GuildData.findOne({
        guildID: interaction.guild!.id,
        roleID: roleID,
        activityName: activityName
      })
    ) {
      interaction.reply({
        content: msg.activityRoleExists(),
        ephemeral: true
      });
      return;
    } else {
      new db.GuildData({
        guildID: interaction?.guild!.id,
        roleID: roleID,
        activityName: activityName,
        exactActivityName: exactActivityName,
        live: live
      }).save();
      if (interaction.guild) db.checkAllRoles(interaction.guild);
      msg.log.addRemoveActivityRole(
        String(interaction.guild!.name),
        String(interaction.guild!.id),
        role.name,
        roleID,
        activityName,
        exactActivityName,
        live,
        true
      );
      interaction.reply({
        embeds: [msg.setNewActivityRole(role.id, activityName, exactActivityName, live)],
        ephemeral: true
      });
    }
  }
} as Command;
