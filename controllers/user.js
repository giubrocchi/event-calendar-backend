const { MongoClient } = require('mongodb');
const { mongoUri, dbName } = require('../databaseInfo.js');
const passwordManager = require('../passwordManager.js');
const collectionName = 'user';

exports.create = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    res.status(400).send({ message: 'Content can not be empty!' });
    return;
  }

  const isUsernameSignedUp = await getUserByUsername(username);
  const isEmailSignedUp = await getUserByEmail(email);

  if (isUsernameSignedUp) {
    res.status(440).send({ message: 'Username already signed up!' });
    return;
  }

  if (isEmailSignedUp) {
    res.status(440).send({ message: 'E-mail already signed up!' });
    return;
  }

  const client = new MongoClient(mongoUri);

  try {
    await client.connect();

    const database = client.db(dbName);
    const collection = database.collection(collectionName);
    const hashedPassword = passwordManager.encrypt(password);
    const result = await collection.insertOne({ username, email, password: hashedPassword });

    res.send(result);
  } catch (err) {
    res.status(500).send('Error creating data.');
  } finally {
    await client.close();
  }
};

async function getUserByUsername(username) {
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();

    const database = client.db(dbName);
    const collection = database.collection(collectionName);
    const result = await collection.findOne({ username });

    await client.close();

    return result;
  } catch (err) {
    await client.close();

    return null;
  }
}

async function getUserByEmail(email) {
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();

    const database = client.db(dbName);
    const collection = database.collection(collectionName);
    const result = await collection.findOne({ email });

    await client.close();

    return result;
  } catch (err) {
    await client.close();

    return null;
  }
}

exports.login = async (req, res) => {
  const { usernameOrEmail, password } = req.body;

  const client = new MongoClient(mongoUri);

  try {
    await client.connect();

    const database = client.db(dbName);
    const collection = database.collection(collectionName);
    const resultByUsername = await collection.findOne({ username: usernameOrEmail });
    const resultByEmail = await collection.findOne({ email: usernameOrEmail });
    const user = resultByUsername ?? resultByEmail;
    const isCorrectPassword = passwordManager.compare(password, user?.password);

    if (isCorrectPassword) res.send({ login: true, id: user._id });
    else res.status(441).send('Wrong username or password');
  } catch (err) {
    res.status(500).send('Error authenticating');
  } finally {
    await client.close();
  }
};
