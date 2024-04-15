const { MongoClient, ObjectId } = require('mongodb');
const { mongoUri, dbName } = require('../databaseInfo.js');
const collectionName = 'event';

exports.create = async (req, res) => {
  const { startDate, finishDate, description, color, organizer } = req.body;

  if (!startDate || !finishDate || !description || !color || !organizer) {
    res.status(400).send({ message: 'Content can not be empty!' });
    return;
  }

  try {
    const userEvents = await getEventsFromUser(organizer);
    const isNewEventOverlapped = isEventOverlapped({ startDate, finishDate }, userEvents);

    if (isNewEventOverlapped) {
      res.status(450).send('Event is overlapping other events.');
      return;
    }
  } catch (err) {
    res.status(500).send('Error creating data.');
    return;
  }

  const client = new MongoClient(mongoUri);

  try {
    await client.connect();

    const database = client.db(dbName);
    const collection = database.collection(collectionName);
    const result = await collection.insertOne({
      startDate,
      finishDate,
      description,
      color,
      organizer,
    });

    res.send(result);
  } catch (err) {
    res.status(500).send('Error creating data.');
  } finally {
    await client.close();
  }
};

async function getEventsFromUser(userId) {
  const client = new MongoClient(mongoUri);

  await client.connect();

  const database = client.db(dbName);
  const collection = database.collection(collectionName);
  const result = await collection.find({ organizer: userId }).toArray();

  await client.close();

  return result;
}

function isEventOverlapped(newEvent = {}, eventList = []) {
  const newEventStartDate = new Date(newEvent.startDate);
  const newEventFinishDate = new Date(newEvent.finishDate);
  const overlappingEvents = eventList.filter((event) => {
    const eventStartDate = new Date(event.startDate);
    const eventFinishDate = new Date(event.finishDate);

    if (newEventStartDate >= eventStartDate && newEventStartDate <= eventFinishDate) return true;
    if (newEventFinishDate >= eventStartDate && newEventFinishDate <= eventFinishDate) return true;
    if (newEventStartDate <= eventStartDate && newEventFinishDate >= eventFinishDate) return true;

    return false;
  });

  return overlappingEvents?.length > 0;
}

exports.getCalendarFromUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await getEventsFromUser(userId);

    res.send(result);
  } catch (err) {
    res.status(500).send('Error authenticating');
  }
};

exports.getEvent = async (req, res) => {
  const { id } = req.params;

  const client = new MongoClient(mongoUri);

  try {
    await client.connect();

    const database = client.db(dbName);
    const collection = database.collection(collectionName);
    const result = await collection.findOne({ _id: new ObjectId(id) });

    res.send(result);
  } catch (err) {
    res.status(500).send('Error authenticating');
  } finally {
    await client.close();
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const { userId, eventId, ...newData } = req.body;

  if (!newData) res.status(400).send({ message: 'Content can not be empty!' });

  try {
    const userEvents = await getEventsFromUser(userId);
    const eventsExcludingEdited = userEvents.filter((event) => event._id.toString() !== eventId);
    const isNewEventOverlapped = isEventOverlapped(newData, eventsExcludingEdited);

    if (isNewEventOverlapped) {
      res.status(450).send('Event is overlapping other events.');
      return;
    }
  } catch (err) {
    res.status(500).send('Error creating data.');
    return;
  }

  const client = new MongoClient(mongoUri);

  try {
    await client.connect();

    const database = client.db(dbName);
    const collection = database.collection(collectionName);

    await collection.updateOne({ _id: new ObjectId(id) }, { $set: newData });

    res.status(200).send('Updated successfully');
  } catch (err) {
    res.status(500).send('Error updating data');
  } finally {
    await client.close();
  }
};

exports.delete = async (req, res) => {
  const { id } = req.params;
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();

    const database = client.db(dbName);
    const collection = database.collection(collectionName);

    await collection.deleteOne({ _id: new ObjectId(id) });

    res.status(200).send('Deleted successfully');
  } catch (err) {
    res.status(500).send('Error deleting data');
  } finally {
    await client.close();
  }
};
