import Discord from 'discord.js';
import config from '../../config';

//? TODO: remove activity dots before a log message is written to stdout
//? TODO: Different languages?
//TODO edit setFooter as they are marked as deprecated

export default {
  ok: () => {
    return 'ok';
  },
  highestBotRoleUndefined: async (
    guildID: Discord.BaseGuild['id'],
    guildName: Discord.BaseGuild['name']
  ) => {
    console.error(
      `guild.me.roles.highest.position === undefined on guild: ${guildName}(${guildID})`
    );
  },
  newLogChannel: (): Discord.MessageEmbed => {
    return new Discord.MessageEmbed()
      .setColor(config.embedColor)
      .setTitle('Logs')
      .setDescription(
        "I will send logs to this channel. You can change it's name or move it, or define a different channel with `/setLogChannel`.\n\
        Be careful: IF there is an error, there will probably be many error messages"
      )
      .setTimestamp();
  },
  set: (): Discord.MessageEmbed => {
    return new Discord.MessageEmbed().setColor(config.embedColor).setTitle('Set!');
  },
  errorCantAssignRole: (
    roleID: Discord.Role['id'],
    rolePosition: Discord.Role['position'],
    userID: Discord.User['id'],
    activityName: string,
    highestBotRole: number
  ): Discord.MessageEmbed => {
    return new Discord.MessageEmbed()
      .setColor('#ff0000')
      .setTitle('Error')
      .setDescription(`Can't assign <@&${roleID}> to <@${userID}>`)
      .addField('Error:', 'Missing permissions')
      .addField('Activity Name:', activityName)
      .addField('My highest role:', `#${highestBotRole}`, true)
      .addField('ActivityRole:', `#${rolePosition}`, true)
      .addField('Solution:', 'Move my any of my roles higher than the role I should give.')
      .setTimestamp();
  },
  errorCantRemoveRole: (
    roleID: Discord.Role['id'],
    rolePosition: Discord.Role['position'],
    userID: Discord.User['id'],
    activityName: string,
    highestBotRole: number
  ) => {
    return new Discord.MessageEmbed()
      .setColor('#ff0000')
      .setTitle('Error')
      .setDescription(`Can't remove <@&${roleID}> from <@${userID}>`)
      .addField('Error:', 'Missing permissions')
      .addField('Activity Name:', activityName)
      .addField('My highest role:', `#${highestBotRole}`, true)
      .addField(`<@&${roleID}>:`, `#${rolePosition}`, true)
      .addField('Solution:', 'Move my any of my roles higher than the role I should remove.')
      .setTimestamp();
  },
  setNewActivityRole: (
    roleID: Discord.Role['id'],
    activityName: string,
    exactActivityName: boolean
  ) => {
    return new Discord.MessageEmbed()
      .setColor(config.embedColor)
      .setTitle('Set!')
      .addField('Role:', '<@&' + roleID + '>')
      .addField('Activity:', activityName)
      .addField('has to be exact:', exactActivityName.toString());
  },
  roleDoesNotExist: () => {
    return ':x: That role does not exist! :x:';
  },
  cantUseEveryone: () => {
    return "*I am powerful, but not **that** powerful!*\nYou can't use @everyone as a game role.";
  },
  activityRoleExists: () => {
    return ":x: That game role already exists in this guild! Edit it with '/editRole'. :x:";
  },
  activityRoleDoesNotExist: () => {
    return ":x: That game role does not exists in this guild! Create it with '/addRole'. :x:";
  },
  removeActivityRoleQ: (activityName: string, roleID: string, exactActivityName: boolean) => {
    return new Discord.MessageEmbed()
      .setTitle('Do you really want to delete this game role?')
      .setColor(config.embedColor)
      .addField('Activity Name', activityName.toString())
      .addField('Role', '<@&' + roleID + '>')
      .addField('Has to be exact', exactActivityName.toString());
  },
  removeButtonRow: () => {
    return new Discord.MessageActionRow()
      .addComponents(
        new Discord.MessageButton().setCustomId('remove').setLabel('Remove').setStyle('DANGER')
      )
      .addComponents(
        new Discord.MessageButton().setCustomId('cancel').setLabel('Cancel').setStyle('SECONDARY')
      );
  },
  navigationButtonRow: (lastDisabled: boolean, nextDisabled: boolean) => {
    return new Discord.MessageActionRow()
      .addComponents(
        new Discord.MessageButton()
          .setCustomId('back')
          .setEmoji('⬅️')
          .setStyle('PRIMARY')
          .setDisabled(lastDisabled)
      )
      .addComponents(
        new Discord.MessageButton()
          .setCustomId('next')
          .setEmoji('➡️')
          .setStyle('PRIMARY')
          .setDisabled(nextDisabled)
      );
  },
  noActivityRoles: () => {
    return 'There are no game roles in this guild.';
  },
  removed: () => {
    return new Discord.MessageEmbed().setTitle('Removed').setColor('RED');
  },
  cancelled: () => {
    return new Discord.MessageEmbed().setTitle('Cancelled').setColor('GREY');
  },
  errorEmbed: () => {
    return new Discord.MessageEmbed().setTitle('Error').setColor('RED');
  },
  inputTooLong: () => {
    return ":x: I'm sorry, but your values are too big for me to handle. :x:";
  },
  activityRolesListInFile: () => {
    return "It's hard to send lists to Discord, so it's in this file. ***hint:** turn off **word wrap** to view the list correctly.*";
  },

  log: {
    // -----------------------------------------------------------------------------------------------------
    login: async (userName: string, discriminator: string, id: string) => {
      console.log(`Discord.JS  > Logged in as ${userName}#${discriminator} (${id})`);
    },
    addGuild: async (
      guildName: Discord.BaseGuild['name'],
      guildID: Discord.BaseGuild['id']
    ): Promise<void> => {
      console.log(`\nMONGODB     > Added guild ${guildName} (${guildID}) to the database.`);
    },
    addUser: async (
      userName: Discord.User['username'],
      userID: Discord.User['id']
    ): Promise<void> => {
      console.log(`\nMONGODB     > Added user ${userName} (${userID}) to the database.`);
    },
    addActivityRole: async (
      guildName: Discord.BaseGuild['name'],
      guildID: Discord.BaseGuild['id'],
      roleName: Discord.Role['name'],
      roleID: Discord.Role['id'],
      activityName: string,
      exactActivityName: boolean
    ) => {
      console.log(
        `\nMONGODB     > New game role added: on guild ${guildName} (${guildID}) role: ${roleName} (${roleID}) activityName: ${activityName}, has to be exact: ${exactActivityName}`
      );
    },
    mongodbConnect: async (): Promise<void> => {
      console.log('MONGODB     > Connected to DB!');
    },
    addedRoleToMember: async (
      roleName: Discord.Role['name'],
      roleID: Discord.Role['id'],
      userName: Discord.User['username'],
      userID: Discord.User['id'],
      guildName: Discord.BaseGuild['name'],
      guildID: Discord.BaseGuild['id']
    ): Promise<void> => {
      console.log(
        `\nDISCORD.JS  > added Role ${roleName} (${roleID}) to user: ${userName} (${userID}) on guild: ${guildName} (${guildID})`
      );
    },
    removedRoleFromMember: async (
      roleName: Discord.Role['name'],
      roleID: Discord.Role['id'],
      userName: Discord.User['username'],
      userID: Discord.User['id'],
      guildName: Discord.BaseGuild['name'],
      guildID: Discord.BaseGuild['id']
    ): Promise<void> => {
      console.log(
        `\nDISCORD.JS  > removed Role ${roleName} (${roleID}) from user: ${userName} (${userID}) on guild: ${guildName} (${guildID})`
      );
    },
    activity: async (): Promise<void> => {
      process.stdout.write('.');
    },
    command: async (): Promise<void> => {
      process.stdout.write(':');
    },
    errorCantAssignRole: async (
      roleName: Discord.Role['name'],
      roleID: Discord.Role['id'],
      rolePosition: Discord.Role['position'],
      userName: Discord.User['username'],
      userID: Discord.User['id'],
      activityName: string,
      highestBotRole: number
    ): Promise<void> => {
      console.log(
        `Error: Can't assign role ${roleName} (${roleID}, rolePosition: ${rolePosition}) to user: ${userName} (${userID}). activityName: ${activityName}, highestBotRole: ${highestBotRole}`
      );
    },
    errorCantRemoveRole: async (
      roleName: Discord.Role['name'],
      roleID: Discord.Role['id'],
      rolePosition: Discord.Role['position'],
      userName: Discord.User['username'],
      userID: Discord.User['id'],
      activityName: string,
      highestBotRole: number
    ): Promise<void> => {
      console.log(
        `Error: Can't remove role ${roleName} (${roleID}, rolePosition: ${rolePosition}) from user: ${userName} (${userID}). activityName: ${activityName}, highestBotRole: ${highestBotRole}`
      );
    }
  }
};
