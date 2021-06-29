const Discord = require('discord.js');
const config = require('../config.js');
const db = require('../modules/db.js');
const messages = require('../modules/messages.js')

module.exports = {
  name: 'ping',
  // aliases: ['p'],
  slash: true,
  testOnly: true,
  description: 'test the connection',
  // category: 'Configuration',
  // expectedArgs: '',
  // minArgs: 0,
  // maxArgs: 0,
  // syntaxError: 'Incorrect syntax! Use `{PREFIX}`ping {ARGUMENTS}',
  // permissions: ['ADMINISTRATOR'],
  // cooldown: '60s',
  // globalCooldown: '10m',
  // hidden: false,
  // ownerOnly: false,
  // guildOnly: false,
  callback: ({ message, channel, args, text, client, prefix, instance, interaction }) => {
    messages.log.activity();

    return new Discord.MessageEmbed()
      .setColor(config.embedColor)
      .setDescription('Pong!');
  }
};