// TODO: also show which roles are assigned to which activity.

import { ICommand } from 'wokcommands';
import config from '../../../config';
import msg from '../messages';
import * as db from '../db';
export default {
  names: 'listactivities',
  category: 'User Configuration',
  description: 'Lists all activities recorded on your account.',

  slash: true,
  testOnly: config.debug,

  callback: async command => {
    msg.log.command();

    const res: db.UserDataType[] = await db.UserData.find({ userID: command.user?.id });
    if (res.length === 0) {
      command.interaction.reply({ content: msg.noActivities() });
      return;
    } else {
      let addToDescription = '';
      const baseEmbed = msg.listActivitiesBaseEmbed(
        command.user?.username,
        command.user?.discriminator
      );
      for (const activity of res) {
        addToDescription += '`' + activity.activityName + '`\n';
      }
      baseEmbed.setDescription(baseEmbed.description + addToDescription);

      command.interaction.reply({ embeds: [baseEmbed] });
    }
  }
} as ICommand;
