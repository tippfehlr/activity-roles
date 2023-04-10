import { REST, Routes, RESTPostAPIApplicationCommandsJSONBody } from 'discord.js';
import fs from 'fs';
import path from 'path';

import { Command } from './modules/commandHandler';
import config from './modules/config';


const commandsDir = './src/modules/commands/';
const commands: RESTPostAPIApplicationCommandsJSONBody[] = [];
const commandFiles = fs.readdirSync(path.resolve(commandsDir)).filter(file => file.endsWith('.ts'));
for (const file of commandFiles) {
  const command: Command = require(path.resolve(commandsDir, file)).default;
  commands.push(command.data.toJSON());
}

let production = false;

if (process.argv[2] === 'prod') production = true;

const rest = new REST({ version: '10' }).setToken(
  production ? process.env.TOKEN_PRODUCTION! : config.TOKEN
);

(async () => {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);
    let data: any;
    if (production) {
      data = await rest.put(Routes.applicationCommands(config.APPLICATION_ID), {
        body: commands
      });
    } else if (config.GUILD) {
      data = await rest.put(Routes.applicationGuildCommands(config.APPLICATION_ID, config.GUILD), {
        body: commands
      });
    }

    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    console.error(error);
  }
})();
