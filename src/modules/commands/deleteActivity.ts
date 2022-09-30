import { ApplicationCommandOptionType } from 'discord.js';
import { db, UserData } from './../db';
import { Command } from '../commandHandler';

import config from '../../../config';
import msg from '../messages';
export default {
  name: 'deleteactivity',
  category: 'User Configuration',
  description: 'Removes an activity from your account.',

  options: [
    {
      name: 'activity',
      description: 'The activity to remove.',
      required: true,
      type: ApplicationCommandOptionType.String
    }
  ],

  testOnly: config.debug,

  callback: async interaction => {
    await interaction.deferReply();

    const res: UserData[] = db
      .prepare('SELECT * FROM userData WHERE userID = ?')
      .all(interaction.user.id);
    const activityNames: string[] = [];
    for (const activity of res) {
      activityNames.push(activity.activityName);
    }
    const activityName = interaction.options.get('activity')?.value as string;
    if (activityNames.includes(activityName)) {
      db.prepare('DELETE FROM userData WHERE userID = ? AND activityName = ?').run(
        interaction.user.id,
        activityName
      );
      interaction.editReply({ content: msg.activityDeleted(activityName) });
    } else {
      interaction.editReply({ content: msg.activityMissing() });
      return;
    }
  }
} as Command;
