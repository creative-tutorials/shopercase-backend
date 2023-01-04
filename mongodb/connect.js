import { MongoClient } from "mongodb";
import colors from "colors";
export default function ConnectToMongoDB() {
  const connectionString = process.env.MONGODB_CONNECTION_STRING;
  const client = new MongoClient(connectionString, { useNewUrlParser: true });
  client.connect((err) => {
    try {
      console.log("Connected Sucessfully".green);
    } catch (error) {
      console.log("Error connecting to MongoDB server".underline.red);
    }
    // client.close();
  });
}
