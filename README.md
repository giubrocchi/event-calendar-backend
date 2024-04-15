# Login system back-end

This is a Node.js project to create a Restful API for a login system with mongdb database.

To run the project:

Create a databaseInfo.js file on the root folder and export two variables:

```
const mongoUri = 'mongodb+srv://[username:password@]host/[defaultauthdb]?retryWrites=true&w=majority'
const databaseName = 'sampleName'

module.exports = { mongoUri, dbName }
```

Start the server with the following command:

```bash
npm install
# and
node server.js
```
