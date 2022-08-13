import {
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
  testOnly?: string[] | false;
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
}
