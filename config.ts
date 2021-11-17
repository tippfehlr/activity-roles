import { ColorResolvable, ActivitiesOptions, ActivityOptions, Activity } from 'discord.js';
require('dotenv').config();
const TOKEN = process.env.TOKEN as string;
const MONGODB_URI = process.env.MONGODB_URI as string;

export default {
  botOwners: ['712702707986595880'],
  inviteLink: 'https://discord.com/api/oauth2/authorize?client_id=813130993640013874&permissions=8&scope=bot%20applications.commands',
  botLogoLink: 'https://i.imgur.com/wSTFkRM.png',
  botOwnerLogoLink: 'https://i.imgur.com/wSTFkRM.png',
  footerMessage: '© 2021 tippfehlr#3575',
  embedColor: '#0099ff' as ColorResolvable,
  activities: [
    { name: 'gr!help', type: 'LISTENING' } as ActivityOptions,
    { name: 'your activities', type: 'LISTENING' } as ActivityOptions,
    { name: 'with you', type: 'PLAYING' } as ActivitiesOptions
  ],
  TOKEN,
  MONGODB_URI
};