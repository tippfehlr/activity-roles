import { ColorResolvable, ActivityOptions } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const TOKEN = process.env.TOKEN as string;
const MONGODB_URI = process.env.MONGODB_URI as string;

export default {
  botOwners: ['000000000000000000'], // your id here
  debug: false, // register slash commands as testOnly
  testGuildIDs: ['000000000000000000'], // if run in debug mode set test guild id here
  listRolesFileName: 'activityRolesList.txt', // the name of the file that gets send on /listroles
  exportFileName: 'export.json', // the name of the file that gets send on /export
  inviteLink:
    'https://discord.com/api/oauth2/authorize?client_id=000000000000000000&permissions=8&scope=bot%20applications.commands', //bot user id here (at ?client_id=)
  botLogoLink: '', // profile picture of the bot
  botAuthorLogoLink: '', // link to profile picture of author :)
  author: 'tippfehlr#3575', // author credits :)
  host: '',
  embedColor: '#0099ff' as ColorResolvable, // the color of most embeds
  activities: [
    { name: '/help', type: 'LISTENING' } as ActivityOptions,
    { name: 'you', type: 'WATCHING' } as ActivityOptions
  ],
  TOKEN,
  MONGODB_URI
};
