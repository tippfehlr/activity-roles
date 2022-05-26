import {
  ApplicationCommand,
  ApplicationCommandOptionData,
  Client,
  CommandInteraction,
  PermissionString
} from 'discord.js';
import fs from 'fs';
import path from 'path';
export { CommandInteraction } from 'discord.js';
import msg, { log } from './messages';

type StringArrayNotEmpty = [string, ...string[]];
export interface Command {
  name: string;
  description: string;
  category: string;
  requiredPermissions?: PermissionString[];
  testOnly?: StringArrayNotEmpty | false;
  guildOnly?: boolean;
  options?: ApplicationCommandOptionData[];
  callback(interaction: CommandInteraction): Promise<void>;

  // delete old wokcommands properties
  slash?: never;
  minArgs?: never;
  expectedArgs?: never;
}

const defaultOptions = {
  commandsDir: './commands/',
  commandFileExtension: ['.js', '.ts'] as string | string[]
};

export default class CommandHandler {
  private client: Client;
  private options: typeof defaultOptions;
  public commands: Map<Command['name'], Command>;

  constructor(client: Client, options = defaultOptions) {
    this.client = client;
    this.options = options;

    this.commands = this.getCommandFiles(
      this.options.commandsDir,
      this.options.commandFileExtension
    );
    this.updateCommands();

    client.on('interactionCreate', async interaction => {
      if (!interaction.isCommand()) return;
      const command = this.commands.get(interaction.commandName);
      if (!command) return;
      if (command.guildOnly && !interaction.guild) {
        interaction.reply(msg.commandGuildOnly());
        return;
      }
      try {
        command.callback(interaction);
      } catch (error) {
        log.error(error, 'Error while executing command' + command.name);
        await interaction.reply({
          content: msg.errorWhileExecutingCommand(),
          ephemeral: true
        });
      }
    });
  }

  getCommandFiles(commandsDir: string, commandFileExtension: string | string[]) {
    const commands = new Map();
    const commandFiles = fs.readdirSync(path.join(__dirname, commandsDir)).filter(file => {
      for (const extension of commandFileExtension) {
        if (file.endsWith(extension)) return true;
      }
      return false;
    });
    for (const file of commandFiles) {
      const command: Command = require(commandsDir + file).default as Command;
      if (command.name.search(/^[-_\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]{1,32}$/gu)) {
        throw new Error(`Command name ${command.name} is invalid`);
      }
      for (const option of command.options || []) {
        if (option.name.search(/^[-_\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]{1,32}$/gu)) {
          throw new Error(`Command option name ${option.name} is invalid`);
        }
      }
      commands.set(command.name, command);
    }
    return commands as Map<string, Command>;
  }

  updateCommands() {
    this.client.application?.commands.fetch().then(() => {
      if (this.client.application?.commands.cache) {
        for (const [, command] of this.client.application.commands.cache) {
          this.checkCommand(command);
        }
      }
      this.client.guilds.fetch();
      for (const [, guild] of this.client.guilds.cache) {
        guild.commands.fetch().then(() => {
          for (const [, command] of guild.commands.cache) {
            this.checkCommand(command);
          }
        });
      }
    });
  }

  async checkCommand(applicationCommand: ApplicationCommand) {
    const command = this.commands.get(applicationCommand.name);
    if (command) {
      this.updateCommand(command, applicationCommand);
    } else {
      this.deleteCommand(applicationCommand);
    }
    return;
  }

  async updateCommand(command: Command, applicationCommand: ApplicationCommand) {
    if (applicationCommand.description !== command.description) {
      applicationCommand.setDescription(command.description);
      log.info(
        `Updated the description of /${command.name} in ${
          applicationCommand.guild
            ? 'guild ' + applicationCommand.guild.name + ' (' + applicationCommand.guild.id + ')'
            : 'global'
        }.`
      );
    }
    if (!this.isCommandOptionsEqual(applicationCommand, command)) {
      applicationCommand.setOptions(command.options ? command.options : []);
      log.info(
        `Updated the options of /${command.name} in ${
          applicationCommand.guild
            ? 'guild ' + applicationCommand.guild.name + ' (' + applicationCommand.guild.id + ')'
            : 'global'
        }.`
      );
    }
    if (command.testOnly && !applicationCommand.guild) {
      this.deleteCommand(applicationCommand);
      this.createCommand(command);
    }
  }

  isAllUndefined(obj: { [key: string]: any }) {
    for (const key of Object.keys(obj)) {
      if (obj[key] !== undefined) return false;
    }
  }

  isCommandOptionsEqual(applicationCommand: ApplicationCommand, command: Command): boolean {
    for (const x in applicationCommand.options) {
      const applicationCommandOption: { [key: string]: any } = applicationCommand.options[x];
      const commandOption: { [key: string]: any } | undefined = command.options?.[x];
      if (
        (commandOption === undefined || this.isAllUndefined(commandOption)) &&
        !this.isAllUndefined(applicationCommandOption)
      ) {
        return false;
      }
      for (const key of Object.keys(applicationCommand.options[x])) {
        if (applicationCommandOption[key] !== commandOption?.[key]) return false;
      }
    }
    return true;
  }

  createCommand(command: Command) {
    if (command.testOnly) {
      for (const guildID of command.testOnly) {
        const guild = this.client.guilds.cache.get(guildID);
        if (guild) {
          guild.commands.create({
            name: command.name,
            description: command.description,
            options: command.options,
            type: 'CHAT_INPUT'
          });
          log.info(`Created command /${command.name} in guild ${guild.name} (${guild.id}).`);
        } else {
          log.warn(`Guild ${guildID} not found when adding guild command /${command.name}`);
        }
      }
    } else {
      this.client.application?.commands.create({
        name: command.name,
        description: command.description,
        options: command.options
      });
      log.info(`Created command /${command.name} in global.`);
    }
  }
  deleteCommand(applicationCommand: ApplicationCommand) {
    applicationCommand.delete();
    log.info(`Deleted command ${applicationCommand.name}.`);
  }
}
