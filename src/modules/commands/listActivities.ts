// TODO: also show which roles are assigned to which activity.

import { ICommand } from 'wokcommands';
import config from '../../../config';
import msg from '../messages';
import * as db from '../db';
export default {
  name: 'listActivities',
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
      res.sort((a, b) => b.activityName.localeCompare(a.activityName) * -1);
      res.forEach(activity => {
        addToDescription += '`' + activity.activityName + '`\n';
      });
      baseEmbed.setDescription(baseEmbed.description + addToDescription);

      command.interaction.reply({ embeds: [baseEmbed] });
    }
  }
} as ICommand;
