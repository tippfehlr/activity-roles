import { ColorResolvable, ActivityOptions } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const TOKEN = process.env.TOKEN as string;
const MONGODB_URI = process.env.MONGODB_URI as string;

export default {
  botOwners: ['000000000000000000'], // your id here
  debug: false, // register slash commands as guildOnly
  testGuildIDs: ['000000000000000000'], // if run in debug mode set test guild id here
  listRolesFileName: 'activityRolesList.txt', // the name of the file that gets send on /listroles
  exportFileName: 'export.json', // the name of the file that gets send on /export
  inviteLink:
    'https://discord.com/api/oauth2/authorize?client_id=000000000000000000&permissions=8&scope=bot%20applications.commands', //bot user id here (at ?client_id=)
  botLogoLink: '', // profile picture of the bot
  botAuthorLogoLink: 'https://drive.google.com/uc?id=1c-jP8Znqm72U2kEhoOdP-DzFvpiyJnvd', // link to profile picture of the author :)
  author: 'tippfehlr#3575', // author credits :)
  host: '',
  embedColor: '#0099ff' as ColorResolvable, // the color of most embeds
  activities: [
    { name: '/help', type: 'LISTENING' } as ActivityOptions,
    { name: 'you', type: 'WATCHING' } as ActivityOptions
  ],
  // if enabled, will call checkAllRoles() on all guilds that have activity or live roles at the interval specified below. Used to assign roles even when presenceUpdate isn't called.
  guildCheckInterval: {
    enabled: false,
    interval: 1000 * 10,
    onlyWithLiveRole: true
  },
  TOKEN,
  MONGODB_URI
};
