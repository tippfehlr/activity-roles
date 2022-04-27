import { ICommand } from 'wokcommands';

import config from '../../../config';
import msg from '../messages';
import * as db from '../db';

export default {
  name: 'activityStats'.toLowerCase(),
  category: 'Information',
  description: 'Shows an aggregation of activities of users in this guild.',
  requiredPermissions: [],

  slash: true,
  testOnly: config.debug,
  guildOnly: true,

  callback: async command => {
    msg.log.command();

    const minPercentBold = 50; // maybe put in config.ts

    const memberIDs = command.guild?.members.cache
      .filter(member => !member.user.bot)
      .map(member => member.id);
    if (!memberIDs) {
      command.interaction.reply({ embeds: [msg.errorEmbed()] });
      return;
    }
    const userData = ((await db.UserData.find({}).lean()) as db.UserDataType[]).filter(
      (user: db.UserDataType) => memberIDs.includes(user.userID)
    );
    if (!userData) {
      command.interaction.reply({ content: msg.noMembersWithActivities() });
      return;
    }
    const heatMap: { [key: string]: number } = {};
    for (const user of userData) {
      heatMap[user.activityName] = (heatMap[user.activityName] || 0) + 1;
    }
    const activities = Object.keys(heatMap).sort((a, b) => heatMap[b] - heatMap[a]);
    const embed = msg.baseActivityStats();
    for (const activity of activities) {
      const appendString = `${embed.description}\n${
        (heatMap[activity] / memberIDs.length) * 100 > minPercentBold ? '**' : ''
      }\`${activity}\`: ${heatMap[activity]} / ${memberIDs.length} member${
        (heatMap[activity] / memberIDs.length) * 100 > minPercentBold ? '**' : ''
      }`;
      if (appendString.length > 2048) break;
      embed.setDescription(appendString);
    }
    command.interaction.reply({ embeds: [embed] });
  }
} as ICommand;
