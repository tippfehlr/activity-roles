import { UserData } from './db';
import {
  ActionRowBuilder,
  BaseGuild,
  ButtonBuilder,
  ButtonStyle,
  Colors,
  EmbedBuilder,
  Guild,
  Role,
  TextBasedChannel,
  TextChannel,
  User
} from 'discord.js';
import config from '../../config';
import pino from 'pino';

export const log = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss.l'
    }
  }
});

//? TODO: Different languages?

/*
Maybe use something like this to switch between strings and embeds 'on the fly' without changing other files.
It should still be possible to use ephemeral messages.

type BaseObject = { guild?: Guild; ephemeral?: boolean };
class BaseMessage {
  content: string | undefined = undefined;
  embeds: EmbedBuilder[] | undefined = undefined;
  ephemeral = false;
  constructor(ephemeral = false) {
    if (ephemeral) this.ephemeral = ephemeral;
  }
}

class highestBotRoleUndefined extends BaseMessage {
  constructor(object?: BaseObject & { channel?: Channel }) {
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
   * @param {BaseGuild['id']} guildID - the ID of the guild that the error occurred in.
   * @param {BaseGuild['name']} guildName - the name of the guild that the error occurred in.
   * @returns None
   */
  newLogChannel: () => {
    return new EmbedBuilder()
      .setColor(config.botColor)
      .setTitle('Logs')
      .setDescription(
        "I will send important messages to this channel. You can change it's name or move it, or define a different channel with `/setLogChannel`."
      );
  },
  noTextChannel(channelID: string) {
    return new EmbedBuilder()
      .setColor(Colors.Red)
      .setTitle('Error')
      .setDescription(`<#${channelID}> isn't a text channel.`);
  },
  /**
   * @returns {EmbedBuilder} a Set! Embed
   */
  set: () => {
    return new EmbedBuilder().setColor(config.botColor).setTitle('Set!');
  },
  /**
   * Creates an error embed that tells the user that they can't assign the role they want to the user.
   * @param {Role} assign - true if assigning, false if removing.
   * @param {Role['id']} roleID - The ID of the role they tried to assign.
   * @param {Role['position']} rolePosition - The position of the role they tried to assign.
   * @param {User['id']} userID - The ID of the user they tried to assign the role to.
   * @param {string} activityName - The name of the activity.
   * @param {number} highestBotRole - The position of the highest role the bot has.
   */
  errorCantAssignRemoveRole: (
    assign: boolean,
    roleID: Role['id'],
    rolePosition: Role['position'],
    userID: User['id'],
    activityName: string,
    highestBotRole: number
  ): EmbedBuilder => {
    return new EmbedBuilder()
      .setColor(Colors.Red)
      .setTitle('Error')
      .setDescription(`Can't assign <@&${roleID}> to <@${userID}>`)
      .addFields(
        { name: 'Error:', value: 'Missing permissions' },
        { name: 'Activity Name:', value: activityName }
      )
      .addFields(
        { name: 'My highest role:', value: `#${highestBotRole}`, inline: true },
        { name: 'ActivityRole:', value: `#${rolePosition}`, inline: true }
      )
      .addFields({
        name: 'Solution:',
        value: 'Move any of my roles higher than the role I should give.'
      })
      .setTimestamp();
  },
  /**
   * @returns {string} 'There was an error while executing this command!'
   **/
  errorWhileExecutingCommand: () => {
    return 'There was an error while executing this command!';
  },
  /**
   * Creates an embed that shows the user that their activity role has been set.
   * @param {Role['id']} roleID - the ID of the role that was set.
   * @param {string} activityName - the name of the activity that the role is set to.
   * @param {boolean} exactActivityName - whether or not the activity name has to be exact.
   * @returns {EmbedBuilder} - the embed that shows the user that their role has been set.
   */
  setNewActivityRole: (
    roleID: Role['id'],
    activityName: string,
    exactActivityName: boolean,
    live: boolean
  ) => {
    return new EmbedBuilder()
      .setColor(config.botColor)
      .setTitle('Success!')
      .addFields(
        { name: 'activity', value: activityName },
        { name: 'role', value: `<@&${roleID}>` },
        { name: 'exact activity name', value: exactActivityName ? 'Yes' : 'No' },
        { name: 'live', value: live ? 'Yes' : 'No' }
      );
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
  commandGuildOnly: () => {
    return 'This command can only be used in a guild.';
  },
  commandMissingPermissions: (permissions: Array<string>) => {
    return 'You are missing the following permissions: ' + permissions.join(', ');
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
   * Creates a EmbedBuilder object that asks the user if they really want to delete a game role.
   * @param {string} activityName - the name of the activity that the role is for.
   * @param {string} roleID - the ID of the role to delete.
   * @param {boolean} exactActivityName - whether or not the activity name has to be exact.
   * @returns {EmbedBuilder} - the EmbedBuilder object.
   */
  removeActivityRoleQ: (
    activityName: string,
    roleID: string,
    exactActivityName: boolean,
    live: boolean
  ) => {
    return new EmbedBuilder()
      .setTitle('Do you really want to delete this game role?')
      .setColor(config.botColor)
      .addFields(
        { name: 'activity', value: activityName.toString() },
        { name: 'role', value: `<@&${roleID}>` },
        { name: 'exact activity name', value: exactActivityName ? 'Yes' : 'No' },
        { name: 'live', value: live ? 'Yes' : 'No' }
      );
  },
  /**
   * Creates a EmbedBuilder that asks the user if they really want to remove all activities from their account.
   * @returns {EmbedBuilder} - A EmbedBuilder that asks the user if they really want to remove all activities from their account.
   */
  removeAllActivities: () => {
    return new EmbedBuilder()
      .setTitle('Do you really want to remove **ALL** activities from your account?')
      .setColor(Colors.Red);
  },
  /**
   * Creates a MessageActionRow object that contains a remove button and a cancel button.
   * @returns {MessageActionRow} - the MessageActionRow() object.
   */
  removeButtonRow: () => {
    return new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder().setCustomId('remove').setLabel('Remove').setStyle(ButtonStyle.Danger)
      )
      .addComponents(
        new ButtonBuilder().setCustomId('cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
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
   * @returns {EmbedBuilder} - A EmbedBuilder object with the title "Removed" and a red color.
   */
  removed: () => {
    return new EmbedBuilder().setTitle('Removed').setColor(Colors.Red);
  },
  /**
   * Returns a EmbedBuilder object with the title 'Cancelled' and the color 'GREY'.
   * @returns {EmbedBuilder} - A EmbedBuilder object with the title 'Cancelled' and the color 'GREY'.
   */
  cancelled: () => {
    return new EmbedBuilder().setTitle('Cancelled').setColor(Colors.Grey);
  },
  /**
   * Creates an error embed.
   * @returns A EmbedBuilder object.
   */
  errorEmbed: () => {
    return new EmbedBuilder().setTitle('Error').setColor(Colors.Red);
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
   * @param {User['id']} userName - the user's name.
   * @param {User['discriminator']} userDiscriminator - the user's discriminator.
   * @returns {EmbedBuilder} - the embed to send.
   */
  listActivitiesBaseEmbed: (userName: User['id'], userDiscriminator: User['discriminator']) => {
    return new EmbedBuilder()
      .setTitle(`Activity List for @${userName}#${userDiscriminator}`)
      .setColor(config.botColor)
      .setDescription(
        'This is a list of all the activities that you have stored for this user.\n' +
          'Delete them with `/deleteActivity` or `/deleteAllActivities` and add one with `/addActivity`.\n\n'
      );
  },
  activityMissing: () => {
    return 'This activity does not exists on your account.';
  },
  activityDeleted: (activityName: string) => {
    return `Removed activity \`${activityName}\` from your account.`;
  },
  removedAllActivities() {
    return new EmbedBuilder().setTitle(`Removed all activities.`).setColor(Colors.Red);
  },
  userStatus(autoRole: boolean) {
    return new EmbedBuilder()
      .setTitle('User Status')
      .setDescription(
        `The bot is currently ${autoRole ? '**enabled**' : '**disabled**'} for this user.\n\n` +
          'You can change this with the command `/toggleAutoRole`.'
      )
      .setColor(autoRole ? Colors.Green : Colors.Red);
  },
  modifiedAutoRole(autoRole: boolean) {
    return new EmbedBuilder()
      .setTitle(
        `Automatic role assignment for your account is now ${
          autoRole ? '**enabled**' : '**disabled**'
        }.`
      )
      .setDescription('You can change this with the command `/toggleAutoRole`.')
      .setColor(autoRole ? Colors.Green : Colors.Red);
  },
  alreadyIsLogChannel: () => {
    return new EmbedBuilder()
      .setDescription('This channel already is your log channel.')
      .setColor(Colors.Red);
  },
  logChannelSet: (channel: TextBasedChannel | TextChannel) => {
    return new EmbedBuilder()
      .setTitle('Set Log Channel')
      .setDescription(`Your log channel is now set to <#${channel.id}>.`)
      .setColor(Colors.Green);
  },
  noMembersWithActivities: () => {
    return 'There are no members with activities in this guild.';
  },
  baseActivityStats: () => {
    return new EmbedBuilder()
      .setDescription('**Activities in this guild**')
      .setColor(config.botColor);
  },
  logChannel: {
    forceDeletedActivityRole: (
      activityName: string,
      roleID: Role['id'],
      exactActivityName: boolean,
      live: boolean
    ) => {
      return new EmbedBuilder()
        .setColor(Colors.Grey)
        .setDescription('Deleted Activity Role because Role was deleted')
        .addFields(
          { name: 'activityName', value: activityName },
          { name: 'roleID', value: roleID },
          { name: 'exactActivityName', value: String(exactActivityName) },
          { name: 'live', value: String(live) }
        );
    }
  },

  log: {
    /**
     * Logs that the bot is logged in to
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
    addGuild: async (guildName: BaseGuild['name'], guildID: BaseGuild['id']): Promise<void> => {
      log.info(`Added guild ${guildName} (${guildID}) to the database.`);
    },
    /**
     * Logs that a user has been added to the database.
     * @param {string} userName - the name of the user.
     * @param {string} userID - the ID of the user.
     * @returns None
     */
    addUser: async (userName: User['username'], userID: User['id']): Promise<void> => {
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
    addRemoveActivityRole: async (
      guildName: BaseGuild['name'],
      guildID: BaseGuild['id'],
      roleName: Role['name'],
      roleID: Role['id'],
      activityName: string,
      exactActivityName: boolean,
      live: boolean,
      added: boolean,
      forced?: boolean
    ) => {
      log.info(
        `${added ? 'New a' : 'A'}ctivity role ${
          added ? 'added' : 'removed'
        }: on guild ${guildName} (${guildID}) role: ${roleName} (${roleID}) activityName: ${activityName}, exactActivityName: ${exactActivityName}, live mode: ${live}${
          forced ? 'because role was deleted.' : ''
        }`
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
      username: User['username'],
      userID: User['id'],
      guildName: Guild['name'],
      guildID: Guild['id'],
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
      roleName: Role['name'],
      roleID: Role['id'],
      userName: User['username'],
      userID: User['id'],
      guildName: BaseGuild['name'],
      guildID: BaseGuild['id'],
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
      roleName: Role['name'],
      roleID: Role['id'],
      rolePosition: Role['position'],
      userName: User['username'],
      userID: User['id'],
      activityName: string,
      highestBotRole: number
    ): Promise<void> => {
      log.info(
        `Error: Can't assign role ${roleName} (${roleID}, rolePosition: ${rolePosition}) to user: ${userName} (${userID}). activityName: ${activityName}, highestBotRole: ${highestBotRole}`
      );
    },
    duplicateActivity: async (userActivityListFiltered: UserData[]) => {
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
      return new EmbedBuilder()
        .setTitle('Activity Roles')
        .setColor(config.botColor)
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
          'A Discord bot that gives and removes roles to/from users based on their discord presence.\n' +
            'It can be decided for each role if the role should be removed when the user stops playing the game (live mode) or not.\n' +
            'Ideal for creating specific-game(s)-only channels.\n' +
            'The bot is in active development, so if you need anything, feel free to join my support guild: https://gg/3K9Yx4ufN7 or open a Github issue: https://github.com/tippf3hlr/activity-roles/issues/new'
        )
        .addFields(
          { name: 'Github', value: 'https://github.com/tippf3hlr/activity-roles/' },
          { name: 'Invite', value: config.inviteLink },
          { name: 'Support Guild', value: config.supportGuildLink },
          {
            name: 'Thanks to these people for suggestions',
            value:
              '@EianLee#7234, @Krampus#2007, @RstY_CZ#2033\nIf I forgot you, please let me know!'
          }
        );
    }
  }
};
