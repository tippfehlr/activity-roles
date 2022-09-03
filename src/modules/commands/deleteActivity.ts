import { Command } from '../commandHandler';

import config from '../../../config';
import msg from '../messages';
import * as db from '../db';
export default {
  name: 'deleteactivity',
  category: 'User Configuration',
  description: 'Removes an activity from your account.',

  options: [
    {
      name: 'activity',
      description: 'The activity to remove.',
      required: true,
      type: 'STRING'
    }
  ],

  testOnly: config.debug,

  callback: async interaction => {
    await interaction.deferReply();
    msg.log.command();

    const res: db.UserDataType[] = await db.UserData.find({ userID: interaction.user?.id });
    const activityNames: string[] = [];
    for (const activity of res) {
      activityNames.push(activity.activityName);
    }
    const activityName = interaction.options.getString('activity')!;
    if (activityNames.includes(activityName)) {
      await db.UserData.deleteOne({ userID: interaction.user?.id, activityName: activityName });
      interaction.editReply({ content: msg.activityDeleted(activityName) });
    } else {
      interaction.editReply({ content: msg.activityMissing() });
      return;
    }
  }
} as Command;
