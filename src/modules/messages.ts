import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Colors,
  EmbedBuilder,
  Role
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
  roleDoesNotExist: () => {
    return ':x: That role does not exist! :x:';
  },
  cantUseEveryone: () => {
    return "You can't use \\@everyone as an activity role.";
  },
  roleTooLow: (
    highestBotRoleID: string,
    highestBotRole: number,
    roleID: string,
    rolePosition: number
  ) => {
    return new EmbedBuilder()
      .setColor(Colors.Red)
      .setDescription(
        'To assign roles, my highest role needs to be higher than the role I am assigning.\nMove any of my roles higher than the role I should manage.'
      )
      .addFields(
        {
          name: 'My highest role:',
          value: `<@&${highestBotRoleID}> (position #${highestBotRole})`
        },
        { name: 'the activity role:', value: `<@&${roleID}> (position #${rolePosition})` }
      );
  },
  commandGuildOnly: () => {
    return 'This command can only be used in a guild.';
  },
  commandMissingPermissions: (permissions: string[]) => {
    return 'You are missing the following permissions: ' + permissions.join(', ');
  },
  activityRoleExists: () => {
    return ':x: That activity role already exists in this guild! :x:';
  },
  activityRoleDoesNotExist: () => {
    return ':x: That activity role does not exists in this guild! :x:';
  },
  removeActivityRoleQ: (
    activityName: string,
    roleID: string,
    exactActivityName: boolean,
    live: boolean
  ) => {
    return new EmbedBuilder()
      .setTitle('Do you really want to delete this activity role?')
      .setColor(config.botColor)
      .addFields(
        { name: 'activity', value: activityName.toString() },
        { name: 'role', value: `<@&${roleID}>` },
        { name: 'exact activity name', value: exactActivityName ? 'Yes' : 'No' },
        { name: 'live', value: live ? 'Yes' : 'No' }
      );
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
   * Returns a string that tells the user that their input is too long.
   * @returns {string} A string that tells the user that their input is too long.
   */
  inputTooLong: () => {
    return ":x: I'm sorry, but your values are too big for me to handle. :x:";
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
  statsEmbed: (guilds: number, roles: number, users: number) => {
    return new EmbedBuilder()
      .setColor(config.botColor)
      .setDescription(
        `The bot currently serves **${guilds} guild${
          guilds === 1 ? '' : 's'
        }** and manages **${roles} activity role${roles === 1 ? '' : 's'}** for **${users} user${
          users === 1 ? '' : 's'
        }**.`
      );
  },
  helpEmbed: () => {
    return new EmbedBuilder()
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
        'A Discord bot for automatic role assignment based on activities.\n' +
          'Support/Suggestions: https://discord.gg/3K9Yx4ufN7\n' +
          'Github: https://github.com/tippf3hlr/activity-roles/\n' +
          'Contact: tippfehlr#3575 | tippfehlr@gmail.com\n' +
          '\n' +
          'If you add an activity role with `/addactivityrole`, the bot will start looking for activities with the specified name. If a user starts an activity with that name, the bot will add the role to the user.\n' +
          'If `exact_activity_name` is set to false, the activity name `Chrome` would also trigger for `Google Chrome`.\n' +
          'If it is true, the activity must match exactly and case-sensitively.\n' +
          "If you set `live` to true, the bot will remove the role from users who got the role from the bot and don't have the activity anymore.\n" +
          '**The bot will not remove any roles that were added manually.**'
      )
      .addFields({
        name: 'Thanks to these people for suggestions',
        value:
          '@EianLee#7234, @Krampus#2007, @RstY_CZ#2033, @dangerBEclose#1654, @skyykc#0218, @Mann#9999\nIf I forgot you, please let me know!'
      });
  }
};
