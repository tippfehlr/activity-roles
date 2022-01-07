import Discord from 'discord.js';
import config from '../../config';


//? TODO: Different languages?

export default {
  errorMessage: 'sorry, something is wrong.',

  newLogChannel: (): Discord.MessageEmbed => {
    return new Discord.MessageEmbed()
      .setColor(config.embedColor)
      .setTitle('Logs')
      .setDescription('I will send logs to this channel. You can change it\'s name or move it, or define a different channel with `/setLogChannel`.\n\
        Be careful: IF there is an error, there will probably be many error messages')
      .setTimestamp()
      .setFooter(config.footerMessage, config.botOwnerLogoLink);
  },
  set: (): Discord.MessageEmbed => {
    return new Discord.MessageEmbed()
      .setColor(config.embedColor)
      .setTitle('Set!');
  },
  errorCantAssignRole: (roleID: string, rolePosition: number, userID: string, activityName: string, highestBotRole: number): Discord.MessageEmbed => {
    return new Discord.MessageEmbed()
      .setColor('#ff0000')
      .setTitle('Error')
      .setDescription(`Can't assign <@&${roleID}> to <@${userID}>`)
      .addField('Error:', 'Missing permissions')
      .addField('Activity Name:', activityName)
      .addField('My highest role:', `#${highestBotRole}`, true)
      .addField('GameRole:', `#${rolePosition}`, true)
      .addField('Solution:', 'Move my any of my roles higher than the role I should give.')
      .setFooter('© 2021 tippfehlr#3575', config.botOwnerLogoLink)
      .setTimestamp();
  },
  errorCantRemoveRole: (roleID: string, rolePosition: number, userID: string, activityName: string, highestBotRole: number): Discord.MessageEmbed => {
    return new Discord.MessageEmbed()
      .setColor('#ff0000')
      .setTitle('Error')
      .setDescription(`Can't remove <@&${roleID}> to <@${userID}>`)
      .addField('Error:', 'Missing permissions')
      .addField('Activity Name:', activityName)
      .addField('My highest role:', `#${highestBotRole}`, true)
      .addField('GameRole:', `#${rolePosition}`, true)
      .addField('Solution:', 'Move my any of my roles higher than the role I should give.')
      .setFooter('© 2021 tippfehlr#3575', config.botOwnerLogoLink)
      .setTimestamp();
  },

  log: { // -----------------------------------------------------------------------------------------------------
    addGuild: async (guildName: string, guildID: string): Promise<void> => {
      console.log(`\nMONGODB > Added guild ${guildName} (${guildID}) to the database.`);
    },
    addUser: async (userUsername: string, userID: string): Promise<void> => {
      console.log(`\nMONGODB > Added user ${userUsername} (${userID}) to the database.`);
    },
    addGameRole: async (guildName: string, guildID: string, roleName: string, roleID: string, activityName: string, excactActivityName: boolean) => {
      console.log(`\nMONGODB > New game role added: on guild ${guildName} (${guildID}) role: ${roleName} (${roleID}) activityName: ${activityName}, included: ${excactActivityName}`);
    },
    mongodbConnect: async (): Promise<void> => {
      console.log('MONGODB > Connected to DB!');
    },
    addedRoleToMember: async (roleName: string, roleID: string, userUsername: string, userID: string, guildName: string, guildID: string): Promise<void> => {
      console.log(`\nDISCORD.JS > added Role ${roleName} (${roleID}) to user: ${userUsername} (${userID}) on guild: ${guildName} (${guildID})`);
    },
    removedRoleFromMember: async (roleName: string, roleID: string, userUsername: string, userID: string, guildName: string, guildID: string): Promise<void> => {
      console.log(`\nDISCORD.JS > removed Role ${roleName} (${roleID}) from user: ${userUsername} (${userID}) on guild: ${guildName} (${guildID})`);
    },
    activity: async (): Promise<void> => {
      process.stdout.write('.');
    },
    command: async (): Promise<void> => {
      process.stdout.write(':');
    },
    errorCantAssignRole: async (roleName: string, roleID: string, rolePosition: number, userName: string, userID: string, activityName: string, highestBotRole: number): Promise<void> => {
      console.log(`Error: Can't assign role ${roleName} (${roleID}, rolePosition: ${rolePosition}) to user: ${userName} (${userID}). activityName: ${activityName}, highestBotRole: ${highestBotRole}`);
    },
    errorCantRemoveRole: async (roleName: string, roleID: string, rolePosition: number, userName: string, userID: string, activityName: string, highestBotRole: number): Promise<void> => {
      console.log(`Error: Can't remove role ${roleName} (${roleID}, rolePosition: ${rolePosition}) from user: ${userName} (${userID}). activityName: ${activityName}, highestBotRole: ${highestBotRole}`);
    }
  }
};