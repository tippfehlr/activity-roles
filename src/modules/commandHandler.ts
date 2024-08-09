import {
  Client,
  CommandInteraction,
  InteractionType,
  SlashCommandBuilder,
  REST,
  Routes,
} from 'discord.js';

import config from './config';
import { getLang } from './db';
import { log, __ } from './messages';

export interface Command {
  data: SlashCommandBuilder;
  execute(interaction: CommandInteraction): Promise<void>;
}

export default class CommandHandler {
  private client: Client;
  public commands: Map<Command['data']['name'], Command>;

  constructor(client: Client) {
    this.client = client;
    this.commands = new Map();

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
            locale: getLang(interaction),
          }),
          ephemeral: true,
        });
      }
    });
  }

  public addCommand(command: Command) {
    this.commands.set(command.data.name, command);
    return this;
  }

  public async uploadCommands() {
    let commandsJSON: any[] = [];

    for (const [, command] of this.commands) {
      commandsJSON.push(command.data.toJSON());
    }

    const rest = new REST().setToken(config.TOKEN);

    log.info(`Started refreshing ${commandsJSON.length} application (/) commands.`);
    let data: any;
    if (config.GUILD) {
      data = await rest.put(Routes.applicationGuildCommands(config.APPLICATION_ID, config.GUILD), {
        body: commandsJSON,
      });
    } else {
      data = await rest.put(Routes.applicationCommands(config.APPLICATION_ID), {
        body: commandsJSON,
      });
    }
    log.info(`Successfully reloaded ${data.length} application (/) commands.`);
    return this;
  }
}
