const { MongoClient, ObjectId } = require('mongodb');
const { mongoUri, dbName } = require('../databaseInfo.js');
const passwordManager = require('../passwordManager.js');
const collectionName = 'user';

exports.create = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).send({ message: 'Content can not be empty!' });
    return;
  }

  const isSignedUp = await getUserByUsername(username);

  if (isSignedUp) {
    res.status(440).send({ message: 'Username already signed up!' });
    return;
  }

  const client = new MongoClient(mongoUri);

  try {
    await client.connect();

    const database = client.db(dbName);
    const collection = database.collection(collectionName);
    const hashedPassword = passwordManager.encrypt(password);
    const result = await collection.insertOne({ username, password: hashedPassword });

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

exports.login = async (req, res) => {
  const { username, password } = req.body;

  const client = new MongoClient(mongoUri);

  try {
    await client.connect();

    const database = client.db(dbName);
    const collection = database.collection(collectionName);
    const result = await collection.findOne({ username });
    const isCorrectPassword = passwordManager.compare(password, result?.password);

    if (isCorrectPassword) res.send({ login: true, id: result._id });
    else res.status(441).send('Wrong username or password');
  } catch (err) {
    res.status(500).send('Error authenticating');
  } finally {
    await client.close();
  }
};

exports.getUser = async (req, res) => {
  const { id } = req.params;

  const client = new MongoClient(mongoUri);

  try {
    await client.connect();

    const database = client.db(dbName);
    const collection = database.collection(collectionName);
    const result = await collection.findOne({ _id: new ObjectId(id) });

    res.send({ ...result, password: null });
  } catch (err) {
    res.status(500).send('Error authenticating');
  } finally {
    await client.close();
  }
};
