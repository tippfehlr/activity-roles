import Discord from 'discord.js';
import config from '../../config';

//? TODO: remove activity dots before a log message is written to stdout
//? TODO: Different languages?
//TODO edit setFooter as they are marked as deprecated

export default {
  /**
   * A function that returns 'ok'.
   * @returns {string} 'ok'
   */
  ok: () => {
    return 'ok';
  },
  /**
   * Logs an error to the console if the highest role on the guild is undefined.
   * @param {Discord.BaseGuild['id']} guildID - the ID of the guild that the error occurred in.
   * @param {Discord.BaseGuild['name']} guildName - the name of the guild that the error occurred in.
   * @returns None
   */
  highestBotRoleUndefined: async (
    guildID: Discord.BaseGuild['id'],
    guildName: Discord.BaseGuild['name']
  ) => {
    console.error(
      `guild.me.roles.highest.position === undefined on guild: ${guildName}(${guildID})`
    );
  },
  /**
   * Creates a new log channel embed.
   * @returns {Discord.MessageEmbed} A new log channel embed.
   */
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
  /**
   * @returns {Discord.MessageEmbed} a Set! Embed
   */
  set: (): Discord.MessageEmbed => {
    return new Discord.MessageEmbed().setColor(config.embedColor).setTitle('Set!');
  },
  /**
   * Creates an error embed that tells the user that they can't assign the role they want to the user.
   * @param {Discord.Role['id']} roleID - The ID of the role they tried to assign.
   * @param {Discord.Role['position']} rolePosition - The position of the role they tried to assign.
   * @param {Discord.User['id']} userID - The ID of the user they tried to assign the role to.
   * @param {string} activityName - The name of the activity.
   * @param {number} highestBotRole - The position of the highest role the bot has.
   */
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
  /**
   * Creates an error message embed that tells the user that they can't remove a role from a user.
   * @param {Discord.Role['id']} roleID - the ID of the role that the user is trying to remove.
   * @param {Discord.Role['position']} rolePosition - the position of the role that the user is trying to remove.
   * @param {Discord.User['id']} userID - the ID of the user that the role is being removed from.
   * @param {string} activityName - the name of the activity.
   * @param {number} highestBotRole - The position of the highest role the bot has.
   */
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
  /**
   * Creates an embed that shows the user that their activity role has been set.
   * @param {Discord.Role['id']} roleID - the ID of the role that was set.
   * @param {string} activityName - the name of the activity that the role is set to.
   * @param {boolean} exactActivityName - whether or not the activity name has to be exact.
   * @returns {Discord.MessageEmbed} - the embed that shows the user that their role has been set.
   */
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
  /**
   * Returns a string that says that the role does not exist.
   * @returns {string} A string that says that the role does not exist.
   */
  roleDoesNotExist: () => {
    return ':x: That role does not exist! :x:';
  },
  /**
   * Returns a string that tells the user that they can't use @everyone as a game role.
   * @returns {string} A string that tells the user that they can't use @everyone as a game role.
   */
  cantUseEveryone: () => {
    return "*I am powerful, but not **that** powerful!*\nYou can't use @everyone as a game role.";
  },
  /**
   * Returns a string that tells the user that the role they are trying to create already exists.
   * @returns {string} A string that tells the user that the role they are trying to create already exists.
   */
  activityRoleExists: () => {
    return ":x: That game role already exists in this guild! Edit it with '/editRole'. :x:";
  },
  activityRoleDoesNotExist: () => {
    return ":x: That game role does not exists in this guild! Create it with '/addRole'. :x:";
  },
  /**
   * Creates a Discord.MessageEmbed object that asks the user if they really want to delete a game role.
   * @param {string} activityName - the name of the activity that the role is for.
   * @param {string} roleID - the ID of the role to delete.
   * @param {boolean} exactActivityName - whether or not the activity name has to be exact.
   * @returns {Discord.MessageEmbed} - the Discord.MessageEmbed object.
   */
  removeActivityRoleQ: (activityName: string, roleID: string, exactActivityName: boolean) => {
    return new Discord.MessageEmbed()
      .setTitle('Do you really want to delete this game role?')
      .setColor(config.embedColor)
      .addField('Activity Name', activityName.toString())
      .addField('Role', '<@&' + roleID + '>')
      .addField('Has to be exact', exactActivityName.toString());
  },
  /**
   * Creates a MessageActionRow object that contains a remove button and a cancel button.
   * @returns {Discord.MessageActionRow} - the Discord.MessageActionRow() object.
   */
  removeButtonRow: () => {
    return new Discord.MessageActionRow()
      .addComponents(
        new Discord.MessageButton().setCustomId('remove').setLabel('Remove').setStyle('DANGER')
      )
      .addComponents(
        new Discord.MessageButton().setCustomId('cancel').setLabel('Cancel').setStyle('SECONDARY')
      );
  },
  //! not needed
  /**
   * Creates a MessageActionRow with the back and next buttons.
   * @param {boolean} lastDisabled - Whether or not the back button should be disabled.
   * @param {boolean} nextDisabled - Whether or not the next button should be disabled.
   * @returns {Discord.MessageActionRow}
   */
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
  /**
   * Returns a string that tells the user that there are no game roles in the guild.
   * @returns {string} - A string that tells the user that there are no game roles in the guild.
   */
  noActivityRoles: () => {
    return 'There are no game roles in this guild.';
  },
  /**
   * Returns aEmbed object with the title "Removed" and a red color.
   * @returns {Discord.MessageEmbed} - A Discord.MessageEmbed object with the title "Removed" and a red color.
   */
  removed: () => {
    return new Discord.MessageEmbed().setTitle('Removed').setColor('RED');
  },
  /**
   * Returns a Discord.MessageEmbed object with the title 'Cancelled' and the color 'GREY'.
   * @returns {Discord.MessageEmbed} - A Discord.MessageEmbed object with the title 'Cancelled' and the color 'GREY'.
   */
  cancelled: () => {
    return new Discord.MessageEmbed().setTitle('Cancelled').setColor('GREY');
  },
  /**
   * Creates an error embed.
   * @returns A Discord.MessageEmbed object.
   */
  errorEmbed: () => {
    return new Discord.MessageEmbed().setTitle('Error').setColor('RED');
  },
  /**
   * Returns a string that tells the user that their input is too long.
   * @returns {string} A string that tells the user that their input is too long.
   */
  inputTooLong: () => {
    return ":x: I'm sorry, but your values are too big for me to handle. :x:";
  },
  /**
   * Returns a string that describes the activity roles list.
   * @returns {string} - a string that describes the activity roles list.
   */
  activityRolesListInFile: () => {
    return "It's hard to send lists to Discord, so it's in this file. ***hint:** turn off **word wrap** to view the list correctly.*";
  },

  log: {
    // -----------------------------------------------------------------------------------------------------
    /**
     * Logs that the bot is logged in to Discord.
     * @param {string} userName - the bot's name
     * @param {string} discriminator - the bot's discriminator
     * @param {string} id - the bot's ID
     * @returns None
     */
    login: async (userName: string, discriminator: string, id: string) => {
      console.log(`Discord.JS  > Logged in as ${userName}#${discriminator} (${id})`);
    },
    /**
     * Logs that a guild has been added to the database.
     * @param {string} guildName - The name of the guild.
     * @param {string} guildID - The ID of the guild.
     * @returns None
     */
    addGuild: async (
      guildName: Discord.BaseGuild['name'],
      guildID: Discord.BaseGuild['id']
    ): Promise<void> => {
      console.log(`\nMONGODB     > Added guild ${guildName} (${guildID}) to the database.`);
    },
    /**
     * Logs that a user has been added to the database.
     * @param {string} userName - the name of the user.
     * @param {string} userID - the ID of the user.
     * @returns None
     */
    addUser: async (
      userName: Discord.User['username'],
      userID: Discord.User['id']
    ): Promise<void> => {
      console.log(`\nMONGODB     > Added user ${userName} (${userID}) to the database.`);
    },
    /**
     * Logs that a new activity role has been added to the database.
     * @param {string} guildName - The name of the guild.
     * @param {string} guildID - The ID of the guild.
     * @param {string} roleName - The name of the role.
     * @param {string} roleID - The ID of the role.
     * @param {string} activityName - The name of the activity.
     * @param {boolean} exactActivityName - Whether the activity name has to be exact.
     * @returns None
     */
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
    /**
     * Logs a connection to the MongoDB database.
     * @returns None
     */
    mongodbConnect: async (): Promise<void> => {
      console.log('MONGODB     > Connected to DB!');
    },
    /**
     * Logs when a role is added to a member.
     * @param {string} roleName - the name of the role that was added.
     * @param {string} roleID - the ID of the role that was added.
     * @param {string} userName - the name of the user that was added.
     * @param {string} userID - the ID of the user that was added.
     * @param {string} guildName - the name of the guild that the role was added to.
     * @param {string} guildID - the ID of the guild that the role was added to.
     * @returns None
     */
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
    /**
     * Logs when a role is removed from a member.
     * @param {string} roleName - the name of the role that was removed from the member.
     * @param {string} roleID - the ID of the role that was removed from the member.
     * @param {string} userName - the name of the user that had the role removed.
     * @param {string} userID - the ID of the user that had the role removed.
     * @param {string} guildName - the name of the guild that the member was removed from.
     * @param {string} guildID - the ID of the guild that the
     */
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
    /**
     * A function that prints a dot to the console.  This is used to show database activity.
     * @returns None
     */
    activity: async (): Promise<void> => {
      process.stdout.write('.');
    },
    /**
     * A function that prints a colon to the console.  This is used to show user activity.
     * @returns None
     */
    command: async (): Promise<void> => {
      process.stdout.write(':');
    },
    /**
     * Logs an error to the console that the bot can't assign a role to a user.
     * @param {string} roleName - The name of the role that couldn't be assigned.
     * @param {string} roleID - The ID of the role that couldn't be assigned.
     * @param {number} rolePosition - The position of the role that couldn't be assigned.
     * @param {string} userName - The name of the user that the role couldn't be added to.
     * @param {string} userID - The ID of the user that the role couldn't be added to.
     * @param {string} activityName - The name of the activity that couldn't be assigned.
     */
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
    /**
     * Logs an error to the console that the bot can't remove a role from a user.
     * @param {string} roleName - The name of the role that couldn't be removed.
     * @param {string} roleID - The ID of the role that couldn't be removed.
     * @param {number} rolePosition - The position of the role that couldn't be removed from.
     * @param {string} userName - The name of the user that the role couldn't be removed from.
     * @param {string} userID - The ID of the user that the role couldn't be removed from.
     * @param {string} activityName - The name of the activity that couldn't be assigned.
     */
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
