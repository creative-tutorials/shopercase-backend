import { MongoClient } from "mongodb";
import colors from "colors";
/**
 * It connects to the MongoDB database, and then inserts the data into the database
 * @param reqbody - {
 * reqbody is coming from the request made from the API server
 */
export default function WriteToDatabase(reqbody) {
  const connectionString = process.env.MONGODB_CONNECTION_STRING;
  const client = new MongoClient(connectionString, { useNewUrlParser: true });

  client.connect((err) => {
    try {
      const collection = client.db("sandbox").collection("users");
      collection.insertOne(reqbody);
      console.log('Data written sucessfully')
    } catch (error) {
      console.log("Error writting data to the database".underline.red);
    }
  });
}
