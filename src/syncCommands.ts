import Discord, { ApplicationCommand, ApplicationCommandType } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { log } from './modules/messages';
import dotenv from 'dotenv';

import { Command } from './modules/commandHandler';
import config from '../config';
dotenv.config();
const client = new Discord.Client({
  intents: [Discord.IntentsBitField.Flags.Guilds, Discord.IntentsBitField.Flags.GuildIntegrations]
});

const commandsDir = './modules/commands/';

client.on('ready', () => {
  client.user?.setPresence({
    status: 'dnd',
    afk: false,
    activities: [{ name: 'Updating Commands', type: Discord.ActivityType.Playing }]
  });
  log.info(
    `Updating commands on ${client.user?.username}#${client.user?.discriminator} (${client.user?.id})`
  );
});

let updatedCommands = 0;
let createdCommands = 0;
let deletedCommands = 0;
let production = false;

if (process.argv[2] === 'prod') production = true;

client.login(production ? process.env.TOKEN_PRODUCTION : config.TOKEN).then(async () => {
  await client.application?.commands.fetch();
  await client.guilds.fetch();
  for (const [, guild] of client.guilds.cache) {
    try {
      await guild.commands.fetch();
    } catch (error) {
      log.error(error);
    }
  }

  const commands = new Map() as Map<string, Command>;
  const commandFiles = fs.readdirSync(path.join(__dirname, commandsDir)).filter(file => {
    const last3 = file.slice(-3);
    if (last3 === '.js' || last3 === '.ts') return true;
    return false;
  });
  for (const file of commandFiles) {
    const command: Command | undefined = require(commandsDir + file).default;
    if (!command) continue;
    if (command.name.search(/^[-_\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]{1,32}$/gu)) {
      throw new Error(`Command name ${command.name} is invalid`);
    }
    for (const option of command.options || []) {
      if (option.name.search(/^[-_\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]{1,32}$/gu)) {
        throw new Error(`Command option name ${option.name} is invalid`);
      }
    }
    if (production) command.testOnly = false;
    commands.set(command.name, command);
  }

  if (client.application?.commands.cache) {
    for (const [, applicationCommand] of client.application.commands.cache) {
      checkCommand(applicationCommand);
    }
  }
  for (const [, guild] of client.guilds.cache) {
    for (const [, applicationCommand] of guild.commands.cache) {
      checkCommand(applicationCommand);
    }
  }

  for (const [, command] of commands) {
    if (command.testOnly && command.testOnly.length > 0) {
      for (const guildID of command.testOnly) {
        const guild = client.guilds.cache.find(guild => guild.id === guildID);
        const applicationCommand = guild?.commands.cache.find(
          applicationCommand => applicationCommand.name === command.name
        );
        if (!guild) continue;
        if (applicationCommand) {
          // updateCommand(command, applicationCommand);
        } else {
          createCommand(command);
        }
      }
    } else {
      const applicationCommand = client.application?.commands.cache.find(
        applicationCommand => applicationCommand.name === command.name
      );
      if (applicationCommand) {
        // updateCommand(command, applicationCommand);
      } else {
        createCommand(command);
      }
    }
  }

  log.info(
    `created ${createdCommands} commands, updated ${updatedCommands} commands, deleted ${deletedCommands} commands.`
  );
  log.info('Finished, closing in 1 sec...');
  setTimeout(() => {
    client.destroy();
    process.exit();
  }, 1000);

  function checkCommand(applicationCommand: ApplicationCommand) {
    const command = commands.get(applicationCommand.name);
    if (command) {
      updateCommand(command, applicationCommand);
    } else {
      deleteCommand(applicationCommand);
    }
    return;
  }

  function updateCommand(command: Command, applicationCommand: ApplicationCommand) {
    let updated = false;
    if (applicationCommand.description !== command.description) {
      applicationCommand.setDescription(command.description);
      log.info(
        `Updated the description of /${command.name} in ${
          applicationCommand.guild
            ? 'guild ' + applicationCommand.guild.name + ' (' + applicationCommand.guild.id + ')'
            : 'global'
        }.`
      );
      updated = true;
    }
    if (!isCommandOptionsEqual(applicationCommand, command)) {
      applicationCommand.setOptions(command.options ? command.options : []);
      log.info(
        `Updated the options of /${command.name} in ${
          applicationCommand.guild
            ? 'guild ' + applicationCommand.guild.name + ' (' + applicationCommand.guild.id + ')'
            : 'global'
        }.`
      );
      updated = true;
    }
    if (
      (command.testOnly && command.testOnly.length > 0 && !applicationCommand.guild) ||
      (!command.testOnly && applicationCommand.guild)
    ) {
      deleteCommand(applicationCommand);
    }
    if (updated) updatedCommands++;
  }

  function deleteCommand(applicationCommand: ApplicationCommand) {
    applicationCommand.delete();
    log.info(
      `Deleted command /${applicationCommand.name} from ${
        applicationCommand.guild
          ? `guild ${applicationCommand.guild.name} (${applicationCommand.guild.id})`
          : 'global'
      }.`
    );
    deletedCommands++;
  }

  function createCommand(command: Command) {
    if (command.testOnly && command.testOnly.length > 0) {
      for (const guildID of command.testOnly) {
        const guild = client.guilds.cache.get(guildID);
        if (guild) {
          guild.commands.create({
            name: command.name,
            description: command.description,
            options: command.options,
            type: ApplicationCommandType.ChatInput
          });
          log.info(`Created command /${command.name} in guild ${guild.name} (${guild.id}).`);
          createdCommands++;
        } else {
          log.warn(`Guild ${guildID} not found when adding guild command /${command.name}`);
        }
      }
    } else {
      client.application?.commands.create({
        name: command.name,
        description: command.description,
        options: command.options
      });
      log.info(`Created command /${command.name} in global.`);
      createdCommands++;
    }
  }

  function isCommandOptionsEqual(
    applicationCommand: ApplicationCommand,
    command: Command
  ): boolean {
    for (const x in applicationCommand.options) {
      const applicationCommandOption: { [key: string]: any } = applicationCommand.options[x];
      const commandOption: { [key: string]: any } | undefined = command.options?.[x];
      if (
        (!commandOption || isAllUndefined(commandOption)) &&
        !isAllUndefined(applicationCommandOption)
      ) {
        return false;
      }
      for (const key of Object.keys(applicationCommand.options[x])) {
        if (applicationCommandOption[key] !== commandOption?.[key]) return false;
      }
    }
    return true;
  }

  function isAllUndefined(obj: { [key: string]: any }) {
    for (const key of Object.keys(obj)) {
      if (obj[key] !== undefined) return false;
    }
  }
});
