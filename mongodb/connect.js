import { MongoClient } from "mongodb";
import colors from "colors";
/**
 * Connect to MongoDB using the connection string stored in the environment variable
 * MONGODB_CONNECTION_STRING
 */
export default function ConnectToMongoDB() {
  const connectionString = process.env.MONGODB_CONNECTION_STRING;
  const client = new MongoClient(connectionString, { useNewUrlParser: true });
  client.connect((err) => {
    try {
      console.log(`${'MongoDB Cluster'}`, `${'Connected Sucessfully'}`.green);
    } catch (error) {
      console.log("Error connecting to MongoDB server".underline.red);
    }
  });
}
