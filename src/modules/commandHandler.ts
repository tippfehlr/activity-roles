import { Client, CommandInteraction, InteractionType, SlashCommandBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { getLang } from './db';
import { log, __ } from './messages';

export interface Command {
  data: SlashCommandBuilder;
  execute(interaction: CommandInteraction): Promise<void>;
}

const defaultOptions = {
  commandsDir: './commands/',
  commandFileExtension: ['.js', '.ts'] as string[]
};

export default class CommandHandler {
  private client: Client;
  private options: typeof defaultOptions;
  public commands: Map<Command['data']['name'], Command>;

  constructor(client: Client, options = defaultOptions) {
    this.client = client;
    this.options = options;

    this.commands = this.getCommandFiles(
      this.options.commandsDir,
      this.options.commandFileExtension
    );

    client.on('interactionCreate', async interaction => {
      if (interaction.type !== InteractionType.ApplicationCommand) return;
      const command = this.commands.get(interaction.commandName);
      if (!command) return;
      try {
        command.execute(interaction);
      } catch (error) {
        log.error(error, 'Error while executing command' + command.data.name);
        await interaction.reply({
          content: __({
            phrase: 'There was an error while executing this command!',
            locale: getLang(interaction)
          }),
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
      commands.set(command.data.name, command);
    }
    return commands as typeof this.commands;
  }
}
