import { REST, Routes, RESTPostAPIApplicationCommandsJSONBody } from 'discord.js';
import fs from 'fs';
import path from 'path';

import { Command } from './src/modules/commandHandler';
import config from './src/modules/config';


const commandsDir = './src/modules/commands/';
const commands: RESTPostAPIApplicationCommandsJSONBody[] = [];
const commandFiles = fs.readdirSync(path.resolve(commandsDir)).filter(file => file.endsWith('.ts'));
for (const file of commandFiles) {
  const command: Command = require(path.resolve(commandsDir, file)).default;
  commands.push(command.data.toJSON());
}


const rest = new REST().setToken(config.TOKEN);

(async () => {
  console.log(`Started refreshing ${commands.length} application (/) commands.`);
  let data: any;
  if (config.GUILD) {
    data = await rest.put(Routes.applicationGuildCommands(config.APPLICATION_ID, config.GUILD), {
      body: commands
    });
  } else {
    data = await rest.put(Routes.applicationCommands(config.APPLICATION_ID), {
      body: commands
    });
  }

  console.log(`Successfully reloaded ${data.length} application (/) commands.`);
})();
