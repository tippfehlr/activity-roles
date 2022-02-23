import { ColorResolvable, ActivitiesOptions, ActivityOptions} from 'discord.js';
require('dotenv').config();

const TOKEN = process.env.TOKEN as string;
const MONGODB_URI = process.env.MONGODB_URI as string;

export default {
  botOwners: ['712702707986595880'],
  debug: true, // register slash commands as testOnly
  testGuildIDs: ['782687651492790314', '727818725784551495', '837681436865593395'],
  listRolesFileName: 'gameRolesList.txt',
  exportFileName: 'export.json',
  inviteLink: 'https://discord.com/api/oauth2/authorize?client_id=813130993640013874&permissions=8&scope=bot%20applications.commands',
  botLogoLink: '',
  botOwnerLogoLink: 'https://doc-04-5c-docs.googleusercontent.com/docs/securesc/1f9nr62sbbtl11kdupfqtt8puefit8dl/p02h61h2c20242nsaufegjsg4urqkjp4/1644664575000/02332544264300670553/02332544264300670553/1c-jP8Znqm72U2kEhoOdP-DzFvpiyJnvd',
  footerMessage: '© 2022 tippfehlr#3575',
  embedColor: '#0099ff' as ColorResolvable,
  activities: [
    { name: '/help', type: 'LISTENING' } as ActivityOptions,
    { name: 'you', type: 'WATCHING' } as ActivityOptions
  ],
  TOKEN,
  MONGODB_URI
};