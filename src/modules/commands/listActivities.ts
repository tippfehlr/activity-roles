// TODO: also show which roles are assigned to which activity.

import { Command } from '../commandHandler';

import config from '../../../config';
import msg from '../messages';
import * as db from '../db';
export default {
  name: 'listactivities',
  category: 'User Configuration',
  description: 'Lists all activities recorded on your account.',

  testOnly: config.debug,

  callback: async interaction => {
    await interaction.deferReply();
    msg.log.command();

    const res: db.UserDataType[] = await db.UserData.find({ userID: interaction.user?.id });
    if (res.length === 0) {
      interaction.editReply({ content: msg.noActivities() });
      return;
    } else {
      let addToDescription = '';
      const baseEmbed = msg.listActivitiesBaseEmbed(
        interaction.user?.username,
        interaction.user?.discriminator
      );
      res.sort((a, b) => b.activityName.localeCompare(a.activityName) * -1);
      res.forEach(activity => {
        addToDescription += '`' + activity.activityName + '`\n';
      });
      baseEmbed.setDescription(baseEmbed.description + addToDescription);

      interaction.editReply({ embeds: [baseEmbed] });
    }
  }
} as Command;
