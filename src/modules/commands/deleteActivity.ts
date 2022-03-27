import { ICommand } from 'wokcommands';
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

  slash: true,
  testOnly: config.debug,

  callback: async command => {
    msg.log.command();

    const res: db.UserDataType[] = await db.UserData.find({ userID: command.user?.id });
    const activities: string[] = [];
    for (const activity of res) {
      activities.push(activity.activityName);
    }
    if (activities.includes(command.args[0])) {
      await db.UserData.deleteOne({ userID: command.user?.id, activityName: command.args[0] });
      command.interaction.reply({ content: msg.activityDeleted(command.args[0]) });
    } else {
      command.interaction.reply({ content: msg.activityMissing() });
      return;
    }
  }
} as ICommand;
