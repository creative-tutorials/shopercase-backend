import { MongoClient } from "mongodb";
import colors from "colors";
export default function WriteToDatabase(reqbody) {
  const connectionString = process.env.MONGODB_CONNECTION_STRING;
  const client = new MongoClient(connectionString, { useNewUrlParser: true });

  client.connect((err) => {
    if (err) {
      console.log("Error connecting to MongoDB server".underline.red);
    } else {
      const collection = client.db('sandbox').collection('users');
      collection.insertOne(reqbody);
    }
    // client.close();
  });
}
