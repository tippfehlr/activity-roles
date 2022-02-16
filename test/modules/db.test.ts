import * as db from '../../src/modules/db';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User as DiscordUser } from 'discord.js';
import mongoose from 'mongoose';


describe('checkUser', () => {
  test('should add a user to the database, because it doesn\'t already exist', async () => {
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    console.log = jest.fn();
    await mongoose.connect(uri);
    const user = { id: '111111111111' } as DiscordUser;

    expect(await db.checkUser(user)).toBe(false);
    expect(await db.UserConfig.findById(user.id)).toBeDefined();

    await mongoose.disconnect();
    return await mongod.stop();
  });
  test('should do nothing because the user already exists', async () => {
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    console.log = jest.fn();
    await db.connect(uri);
    const user = { id: '111111111111' } as DiscordUser;
    await new db.UserConfig({
      _id: user.id.toString(),
      autoRole: true
    }).save();

    expect(await db.checkUser(user)).toBe(true);
    expect(await db.UserConfig.findById(user.id)).toBeDefined(); //check that checkUser doesn't accidentaly delete anything

    await mongoose.disconnect();
    return await mongod.stop();
  });
});
