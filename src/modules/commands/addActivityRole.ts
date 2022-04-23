import { ICommand } from 'wokcommands';

import config from '../../../config';
import msg from '../messages';
import * as db from '../db';
export default {
  names: 'addActivityRole'.toLowerCase(),
  category: 'Configuration',
  description: 'Adds an activity role to your guild.',
  requiredPermissions: ['MANAGE_ROLES'],

  slash: true,
  testOnly: config.debug,
  guildOnly: true,

  minArgs: 2,
  expectedArgs: '<num1> <num2>',
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

  callback: async command => {
    msg.log.command();

    const [roleID, activityName] = command.args;
    if (activityName.length > 1024) return msg.inputTooLong();
    console.log(command.args);
    const exactActivityName = command.args[2] === 'true';
    const live = command.args[3] === 'true';
    const role = command?.guild?.roles.cache.get(roleID);
    if (!role) {
      command.interaction.reply({ content: msg.roleDoesNotExist(), ephemeral: true });
      return;
    }
    if (role.name === '@everyone') {
      command.interaction.reply({ content: msg.cantUseEveryone(), ephemeral: true });
      return;
    }
    if (
      await db.GuildData.findOne({
        guildID: command?.guild?.id,
        roleID: roleID,
        activityName: activityName
      })
    ) {
      command.interaction.reply({
        content: msg.activityRoleExists(),
        ephemeral: true
      });
      return;
    } else {
      new db.GuildData({
        guildID: command?.guild?.id,
        roleID: roleID,
        activityName: activityName,
        exactActivityName: exactActivityName,
        live: live
      }).save();
      if (command.guild) db.checkAllRoles(command.guild);
      msg.log.addActivityRole(
        String(command?.guild?.name),
        String(command?.guild?.id),
        role.name,
        roleID,
        activityName,
        exactActivityName,
        live
      );
      command.interaction.reply({
        embeds: [msg.setNewActivityRole(role.id, activityName, exactActivityName, live)],
        ephemeral: true
      });
    }
  }
} as ICommand;
