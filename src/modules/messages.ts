import Discord from 'discord.js';
import config from '../../config';
import pino from 'pino';
import { UserDataType } from './db';

export const log = pino();

//? TODO: Different languages?

/*
Maybe use something like this to switch between strings and embeds 'on the fly' without changing other files.
It should still be possible to use ephemeral messages.

type BaseObject = { guild?: Discord.Guild; ephemeral?: boolean };
class BaseMessage {
  content: string | undefined = undefined;
  embeds: Discord.MessageEmbed[] | undefined = undefined;
  ephemeral = false;
  constructor(ephemeral = false) {
    if (ephemeral) this.ephemeral = ephemeral;
  }
}

class highestBotRoleUndefined extends BaseMessage {
  constructor(object?: BaseObject & { channel?: Discord.Channel }) {
    super(object?.ephemeral);
    this.content = 'The highest bot role is undefined.';
  }
}
*/

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
  newLogChannel: (): Discord.MessageEmbed => {
    return new Discord.MessageEmbed()
      .setColor(config.embedColor)
      .setTitle('Logs')
      .setDescription(
        "I will send important messages to this channel. You can change it's name or move it, or define a different channel with `/setLogChannel`."
      );
  },
  noTextChannel(channelID: string) {
    return new Discord.MessageEmbed()
      .setColor('RED')
      .setTitle('Error')
      .setDescription(`<#${channelID}> isn't a text channel.`);
  },
  /**
   * @returns {Discord.MessageEmbed} a Set! Embed
   */
  set: (): Discord.MessageEmbed => {
    return new Discord.MessageEmbed().setColor(config.embedColor).setTitle('Set!');
  },
  /**
   * Creates an error embed that tells the user that they can't assign the role they want to the user.
   * @param {Discord.Role} assign - true if assigning, false if removing.
   * @param {Discord.Role['id']} roleID - The ID of the role they tried to assign.
   * @param {Discord.Role['position']} rolePosition - The position of the role they tried to assign.
   * @param {Discord.User['id']} userID - The ID of the user they tried to assign the role to.
   * @param {string} activityName - The name of the activity.
   * @param {number} highestBotRole - The position of the highest role the bot has.
   */
  errorCantAssignRemoveRole: (
    assign: boolean,
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
      .addField('Solution:', 'Move any of my roles higher than the role I should give.')
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
    exactActivityName: boolean,
    live: boolean
  ) => {
    return new Discord.MessageEmbed()
      .setColor(config.embedColor)
      .setTitle('Set!')
      .addField('Role:', '<@&' + roleID + '>')
      .addField('Activity:', activityName)
      .addField('exact activity name:', exactActivityName.toString())
      .addField('live:', live.toString());
  },
  /**
   * Returns a string that says that the role does not exist.
   * @returns {string} A string that says that the role does not exist.
   */
  roleDoesNotExist: () => {
    return ':x: That role does not exist! :x:';
  },
  /**
   * Returns a string that says that the channel does not exist.
   * @returns {string} A string that says that the channel does not exist.
   */
  channelDoesNotExist: () => {
    return ':x: That channel does not exist! :x:';
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
  removeActivityRoleQ: (
    activityName: string,
    roleID: string,
    exactActivityName: boolean,
    live: boolean
  ) => {
    return new Discord.MessageEmbed()
      .setTitle('Do you really want to delete this game role?')
      .setColor(config.embedColor)
      .addField('Activity Name', activityName.toString())
      .addField('Role', '<@&' + roleID + '>')
      .addField('Has to be exact', exactActivityName.toString())
      .addField('Live', live.toString());
  },
  /**
   * Creates a Discord.MessageEmbed that asks the user if they really want to remove all activities from their account.
   * @returns {Discord.MessageEmbed} - A Discord.MessageEmbed that asks the user if they really want to remove all activities from their account.
   */
  removeAllActivities: () => {
    return new Discord.MessageEmbed()
      .setTitle('Do you really want to remove **ALL** activities from your account?')
      .setColor('RED');
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
  /**
   * Returns a string that tells the user that there are no activity roles in the guild.
   * @returns {string} - A string that tells the user that there are no activity roles in the guild.
   */
  noActivityRoles: () => {
    return 'There are no activity roles in this guild.';
  },
  /**
   * Returns a string that tells the user that there are no activities for their account.
   * @returns {string} - A string that tells the user that there are no activities for their account.
   */
  noActivities: () => {
    return 'There are no activities stored for your user.';
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
  /**
   * Creates a base embed for the list activities command.
   * @param {Discord.User['id']} userName - the user's name.
   * @param {Discord.User['discriminator']} userDiscriminator - the user's discriminator.
   * @returns {Discord.MessageEmbed} - the embed to send.
   */
  listActivitiesBaseEmbed: (
    userName: Discord.User['id'],
    userDiscriminator: Discord.User['discriminator']
  ) => {
    return new Discord.MessageEmbed()
      .setTitle(`Activity List for @${userName}#${userDiscriminator}`)
      .setColor(config.embedColor)
      .setDescription(
        'This is a list of all the activities that you have stored for this user.\n\
        Delete them with `/deleteActivity` or `/deleteAllActivities` and add one with `/addActivity`.\n\n'
      );
  },
  activityMissing: () => {
    return 'This activity does not exists on your account.';
  },
  activityDeleted: (activityName: string) => {
    return `Removed activity \`${activityName}\` from your account.`;
  },
  removedActivitiesCount(removedActivitiesCount: number) {
    return new Discord.MessageEmbed()
      .setTitle(`Removed ${removedActivitiesCount} activities.`)
      .setColor('RED');
  },
  userStatus(autoRole: boolean) {
    return new Discord.MessageEmbed()
      .setTitle('User Status')
      .setDescription(
        `The bot is currently ${autoRole ? '**enabled**' : '**disabled**'} for this user.\n\n\
        You can change this with the command \`/toggleAutoRole\`.`
      )
      .setColor(autoRole ? 'GREEN' : 'RED');
  },
  modifiedAutoRole(autoRole: boolean) {
    return new Discord.MessageEmbed()
      .setTitle(
        `Automatic role assignment for your account is now ${
          autoRole ? '**enabled**' : '**disabled**'
        }.`
      )
      .setDescription('You can change this with the command `/toggleAutoRole`.')
      .setColor(autoRole ? 'GREEN' : 'RED');
  },
  alreadyIsLogChannel: () => {
    return new Discord.MessageEmbed()
      .setDescription('This channel already is your log channel.')
      .setColor('RED');
  },
  logChannelSet: (channel: Discord.GuildBasedChannel) => {
    return new Discord.MessageEmbed()
      .setTitle('Set Log Channel')
      .setDescription(`Your log channel is now set to <#${channel.id}>.`)
      .setColor('GREEN');
  },

  log: {
    /**
     * A function that prints a dot to the console.  This is used to show database activity.
     * @returns None
     */
    activity: async (): Promise<void> => {
      // process.stdout.write('.');
    },
    /**
     * A function that prints a colon to the console.  This is used to show user activity.
     * @returns None
     */
    command: async (): Promise<void> => {
      // process.stdout.write(':');
    },
    /**
     * Logs that the bot is logged in to Discord.
     * @param {string} userName - the bot's name
     * @param {string} discriminator - the bot's discriminator
     * @param {string} id - the bot's ID
     * @returns None
     */
    login: async (userName: string, discriminator: string, id: string) => {
      log.info(`Logged in to Discord as ${userName}#${discriminator} (${id})`);
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
      log.info(`Added guild ${guildName} (${guildID}) to the database.`);
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
      log.info(`Added user ${userName} (${userID}) to the database.`);
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
      exactActivityName: boolean,
      live: boolean
    ) => {
      log.info(
        `New activity role added: on guild ${guildName} (${guildID}) role: ${roleName} (${roleID}) activityName: ${activityName}, exactActivityName: ${exactActivityName}, live mode: ${live}`
      );
    },
    /**
     * Logs a connection to the MongoDB database.
     * @returns None
     */
    mongodbConnect: async (): Promise<void> => {
      log.info('Connected to MongoDB database.');
    },
    /**
     *
     * @param username the username of the user
     * @param userID the id of the user
     * @param guildName the name of the guild
     * @param guildID the id of the guild
     * @param activityName the name of the activity
     */
    newActivity: async (
      username: Discord.User['username'],
      userID: Discord.User['id'],
      guildName: Discord.Guild['name'],
      guildID: Discord.Guild['id'],
      activityName: string
    ) => {
      log.info(
        `New activity: ${username} (${userID}) from guild ${guildName} (${guildID}) plays ${activityName}.`
      );
    },
    /**
     * Logs when a role is added to a member.
     * @param {boolean} added - true if the role was added, false if it was removed.
     * @param {string} roleName - the name of the role that was added.
     * @param {string} roleID - the ID of the role that was added.
     * @param {string} userName - the name of the user that was added.
     * @param {string} userID - the ID of the user that was added.
     * @param {string} guildName - the name of the guild that the role was added to.
     * @param {string} guildID - the ID of the guild that the role was added to.
     * @param {boolean} live - whether the role is a live role mode.
     * @returns None
     */
    addedRemovedRoleToFromMember: async (
      added: boolean,
      roleName: Discord.Role['name'],
      roleID: Discord.Role['id'],
      userName: Discord.User['username'],
      userID: Discord.User['id'],
      guildName: Discord.BaseGuild['name'],
      guildID: Discord.BaseGuild['id'],
      live: boolean
    ): Promise<void> => {
      log.info(
        `${added ? 'Added' : 'Removed'} Role ${roleName} (${roleID}) ${
          added ? 'to' : 'from'
        } user: ${userName} (${userID}) on guild: ${guildName} (${guildID}) live: ${live}`
      );
    },
    /**
     * Logs an error to the console that the bot can't assign a role to a user.
     * @param {string} assign - true if assigning, false if removing.
     * @param {string} roleName - The name of the role that couldn't be assigned.
     * @param {string} roleID - The ID of the role that couldn't be assigned.
     * @param {number} rolePosition - The position of the role that couldn't be assigned.
     * @param {string} userName - The name of the user that the role couldn't be added to.
     * @param {string} userID - The ID of the user that the role couldn't be added to.
     * @param {string} activityName - The name of the activity that couldn't be assigned.
     */
    errorCantAssignRemoveRole: async (
      assign: boolean,
      roleName: Discord.Role['name'],
      roleID: Discord.Role['id'],
      rolePosition: Discord.Role['position'],
      userName: Discord.User['username'],
      userID: Discord.User['id'],
      activityName: string,
      highestBotRole: number
    ): Promise<void> => {
      log.info(
        `Error: Can't assign role ${roleName} (${roleID}, rolePosition: ${rolePosition}) to user: ${userName} (${userID}). activityName: ${activityName}, highestBotRole: ${highestBotRole}`
      );
    },
    duplicateActivity: async (userActivityListFiltered: UserDataType[]) => {
      log.warn(userActivityListFiltered, 'Encountered duplicate activity');
    },
    checkGuildIntervalEnabled: async (guildCount: number) => {
      log.info(
        `guild check interval enabled on ${guildCount} (${
          config.guildCheckInterval.onlyWithLiveRole ? 'onlyLive' : 'all'
        }) guilds with interval: ${config.guildCheckInterval.interval / 1000} seconds`
      );
    }
  },
  help: {
    helpEmbed: () => {
      return new Discord.MessageEmbed()
        .setTitle('Activity Roles Help')
        .setColor(config.embedColor)
        .setFooter({
          // = Made and hosted by <author>.
          // or
          // = Made by <author> and hosted by <host>
          text: `Made ${config.author === config.host ? 'and hosted ' : ''}by ${config.author}${
            config.author !== config.host ? ` and hosted by ${config.host}` : ''
          } `,
          iconURL: config.botAuthorLogoLink
        })
        .setDescription(
          "A discord bot that gives and removes roles from users dependent on their discord presence, but unlike other bots it doesn't remove them if you stop playing. \n\n\
          Intended to show which people play what game and to therefore give them access to specific channels etc."
        )
        .addField('Github', 'https://github.com/tippf3hlr/activity-roles/')
        .addField('Invite', config.inviteLink)
        .addField('Support Guild', config.supportGuildLink)
        .addField(
          'Commands:\n`/addActivityRole <role> <activity> <exactActivityName> <live>`',
          "Adds a new activity role to your guild. Requires the `MANAGE_ROLES` permission.\n\
          `<role>` is the role that gets added to users when they have the right `<activity>`.\n\
          If `<exactActivityName>` is set to True, the role will only be added if the user has the exact activity name.\n\
          If it is false, `<activity>` can also just be a substring of the user's activity name.\n\
          If `<live>` is set to True, the role will be only added when the user currently has the activity, and gets removed once it doesn't anymore."
        )
        .addField('`/deleteActivity <Activity>`', 'Removes an activity from your account.')
        .addField('`/deleteAllActivities`', 'Removes all activities from your account.')
        .addField(
          '`/export`',
          'Exports all game roles in your guild as a JSON file. Requires the `MANAGE_ROLES` permission.'
        )
        .addField('`/help`', 'Shows this help page.')
        .addField('`/listActivities`', 'Lists all activities in your account.')
        .addField(
          '`/listRoles`',
          'Lists all game roles in your guild. Requires the `MANAGE_ROLES` permission.'
        )
        .addField(
          '`/removeActivityRole <role> <activityName>`',
          'Deletes an activity role from your guild. Requires the `MANAGE_ROLES` permission.'
        )
        .addField(
          '`/setLogChannel [channel]`',
          'Sets the log channel. Requires the `MANAGE_ROLES` permission.'
        )
        .addField('`/toggleAutoRole [true/false]`', 'Enables/Disables automatic role assignment')
        .addField('`/update`', 'Updates all activity roles.');
    }
  }
};
