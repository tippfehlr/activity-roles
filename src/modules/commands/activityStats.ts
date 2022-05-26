import { Command } from '../commandHandler';

import config from '../../../config';
import msg from '../messages';
import * as db from '../db';

export default {
  name: 'activitystats',
  category: 'Information',
  description: 'Shows an aggregation of activities of users in this guild.',
  requiredPermissions: [],
  testOnly: config.debug,
  guildOnly: true,

  callback: async interaction => {
    msg.log.command();
    const minPercentBold = 50; // maybe put in config.ts

    await interaction.guild!.members.fetch();
    const memberIDs = interaction.guild!.members.cache
      .filter(member => !member.user.bot)
      .map(member => member.id);
    if (!memberIDs) {
      interaction.reply({ embeds: [msg.errorEmbed()] });
      return;
    }
    const userData = ((await db.UserData.find({}).lean()) as db.UserDataType[]).filter(
      (user: db.UserDataType) => memberIDs.includes(user.userID)
    );
    if (!userData) {
      interaction.reply({ content: msg.noMembersWithActivities() });
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
    interaction.reply({ embeds: [embed] });
  }
} as Command;
