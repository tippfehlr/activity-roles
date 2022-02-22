import { ColorResolvable, ActivitiesOptions, ActivityOptions} from 'discord.js';
require('dotenv').config();

const TOKEN = process.env.TOKEN as string;
const MONGODB_URI = process.env.MONGODB_URI as string;

export default {
  botOwners: ['712702707986595880'],
  debug: true, // register slash commands as testOnly
  listRolesFileName: 'gameRolesList.txt',
  exportFileName: 'export.json',
  inviteLink: 'https://discord.com/api/oauth2/authorize?client_id=813130993640013874&permissions=8&scope=bot%20applications.commands',
  botLogoLink: '',
  botOwnerLogoLink: 'https://doc-04-5c-docs.googleusercontent.com/docs/securesc/1f9nr62sbbtl11kdupfqtt8puefit8dl/p02h61h2c20242nsaufegjsg4urqkjp4/1644664575000/02332544264300670553/02332544264300670553/1c-jP8Znqm72U2kEhoOdP-DzFvpiyJnvd',
  footerMessage: '© 2022 tippfehlr#3575',
  embedColor: '#0099ff' as ColorResolvable,
  activities: [
    { name: 'gr!help', type: 'LISTENING' } as ActivityOptions,
    { name: 'your activities', type: 'LISTENING' } as ActivityOptions,
    { name: 'with you', type: 'PLAYING' } as ActivitiesOptions
  ],
  TOKEN,
  MONGODB_URI
};