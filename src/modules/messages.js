const Discord = require('discord.js');
const config = require('../config.js');


//? TODO: Different languages?

module.exports = {
  newLogChannel: () => {
    return new Discord.MessageEmbed()
      .setColor(config.embedColor)
      .setTitle('Logs')
      .setDescription('I will send logs to this channel. You can change it\'s name or move it, or define a different channel with `/setLogChannel`.\n\
        Be careful: IF there is an error, there will probably be many error messages')
      .setTimestamp()
      .setFooter(config.footerMessage, config.botOwnerLogoLink);
  },
  set: () => {
    return new Discord.MessageEmbed()
      .setColor(config.embedColor)
      .setTitle('Set!');
  },
  errorCantAssignRole: (roleID, rolePosition, userID, activityName, highestBotRole) => {
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
  errorCantRemoveRole: (roleID, rolePosition, userID, activityName, highestBotRole) => {
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
    addGuild: async (guildName, guildID) => {
      console.log(`\nMONGODB > Added guild ${guildName} (${guildID}) to the database.`);
    },
    addUser: async (userUsername, userID) => {
      console.log(`\nMONGODB > Added user ${userUsername} (${userID}) to the database.`);
    },
    mongodbConnect: async () => {
      console.log('MONGODB > Connected to DB!');
    },
    addedRoleToMember: async (roleName, roleID, userUsername, userID, guildName, guildID) => {
      console.log(`\nDISCORD.JS > added Role ${roleName} (${roleID}) to user: ${userUsername} (${userID}) on guild: ${guildName} (${guildID})`);
    },
    removedRoleFromMember: (roleName, roleID, userUsername, userID, guildName, guildID) => {
      console.log(`\nDISCORD.JS > removed Role ${roleName} (${roleID}) from user: ${userUsername} (${userID}) on guild: ${guildName} (${guildID})`);
    },
    activity: () => {
      process.stdout.write('.');
    },
    command: () => {
      process.stdout.write(':');
    },
    errorCantAssignRole: async () => {
      console.log('TODO messages.js/errorCantAssignRole'); //TODO:
    },
    errorCantRemoveRole: async () => {
      console.log('TODO messages.js/errorCantRemoveRole'); //TODO:
    }
  }
};