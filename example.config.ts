import { ColorResolvable, ActivitiesOptions, ActivityOptions} from 'discord.js';
require('dotenv').config();

const TOKEN = process.env.TOKEN as string;
const MONGODB_URI = process.env.MONGODB_URI as string;

export default {
  botOwners: ['000000000000000000'], // your id here
  debug: false, // register slash commands as testOnly
  testGuildIDs: ['000000000000000000'], // if run in debug mode test guild id here
  listRolesFileName: 'gameRolesList.txt', // the name of the file that gets send on /listroles
  exportFileName: 'export.json',// the name of the file that gets send on /export
  inviteLink: 'https://discord.com/api/oauth2/authorize?client_id=000000000000000000&permissions=8&scope=bot%20applications.commands', //bot user id here (at ?client_id=)
  botLogoLink: '', // profile picture of the bot
  botOwnerLogoLink: 'https://doc-04-5c-docs.googleusercontent.com/docs/securesc/1f9nr62sbbtl11kdupfqtt8puefit8dl/p02h61h2c20242nsaufegjsg4urqkjp4/1644664575000/02332544264300670553/02332544264300670553/1c-jP8Znqm72U2kEhoOdP-DzFvpiyJnvd', // profile picture of author :)
  footerMessage: '© 2022 tippfehlr#3575', // author credits :)
  embedColor: '#0099ff' as ColorResolvable, // the color of most embeds
  activities: [
    { name: '/help', type: 'LISTENING' } as ActivityOptions,
    { name: 'you', type: 'WATCHING' } as ActivityOptions
  ],
  TOKEN,
  MONGODB_URI
};