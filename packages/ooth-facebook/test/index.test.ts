import * as express from 'express';
import * as session from 'express-session';
import { MongoClient } from 'mongodb';
import MongodbMemoryServer from 'mongodb-memory-server';
import { Ooth } from 'ooth';
import { OothMongo } from 'ooth-mongo';
import * as request from 'request-promise';

import oothFacebook from '../src';

let mongoServer;
let con;
let app;
let server;
let ooth;
let oothMongo;
let db;

const startServer = () => {
  return new Promise((resolve) => {
    server = app.listen(8080, resolve());
  });
};

describe('ooth-facebook', () => {
  beforeAll(async () => {
    mongoServer = new MongodbMemoryServer();
    const connectionString = await mongoServer.getConnectionString();
    const dbName = await mongoServer.getDbName();
    con = await MongoClient.connect(connectionString);
    db = con.db(dbName);
  });

  afterAll(async () => {
    await con.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    app = express();
    app.use(
      session({
        name: 'api-session-id',
        secret: 'x',
        resave: false,
        saveUninitialized: true,
      }),
    );
    oothMongo = new OothMongo(db);
    ooth = new Ooth({
      app,
      backend: oothMongo,
      sharedSecret: '',
      standalone: false,
      path: '',
      onLogin: () => null,
      onLogout: () => null,
    });
    oothFacebook({
      ooth,
      clientID: 'XXX',
      clientSecret: 'XXX',
    });
    await startServer();
  });

  afterEach(async () => {
    if (server) {
      await server.close();
    }
    if (db) {
      await db.dropDatabase();
    }
    cookies = '';
  });

  test('fails to log in with valid token', async () => {
    try {
      const res = await request({
        method: 'POST',
        uri: 'http://localhost:8080/facebook/login',
        json: true,
        body: {
          access_token: 'XXX',
        },
      });
    } catch (e) {
      expect(e.response.statusCode).toBe(400);
      expect(e.response.body).toMatchSnapshot();
    }
  });
});