import { db, UserData } from './../db';
// TODO: also show which roles are assigned to which activity.

import { Command } from '../commandHandler';

import config from '../../../config';
import msg from '../messages';
export default {
  name: 'listactivities',
  category: 'User Configuration',
  description: 'Lists all activities recorded on your account.',

  testOnly: config.debug,

  callback: async interaction => {
    await interaction.deferReply();

    const res: UserData[] = db
      .prepare('SELECT * FROM userData WHERE userID = ?')
      .all(interaction.user.id);
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
      for (const activity of res) {
        if ((addToDescription + '`' + activity.activityName + '`\n').length > 4096) break;
        else addToDescription += '`' + activity.activityName + '`\n';
      }
      baseEmbed.setDescription(baseEmbed.data.description + addToDescription);

      interaction.editReply({ embeds: [baseEmbed] });
    }
  }
} as Command;
