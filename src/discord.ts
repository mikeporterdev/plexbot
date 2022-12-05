import { Client } from 'discord.js';

const client = new Client();
client.login(process.env.DISCORD_KEY);

export default client;
