import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'

// MEMO: Load `.env` file
dotenv.config()

const dbUsername = process.env.DB_USERNAME
const dbPassword = process.env.DB_PASSWORD
const dbConnectURI = `mongodb+srv://${dbUsername}:${dbPassword}@twitterclonecluster.rpihvgj.mongodb.net/?retryWrites=true&w=majority&appName=TwitterCloneCluster`

class DatabaseService {
  private client: MongoClient

  constructor() {
    this.client = new MongoClient(dbConnectURI)
  }

  async checkDBConnection() {
    try {
      // Send a ping to confirm a successful connection
      await this.client.db('admin').command({ ping: 1 })
      console.log('Pinged your deployment. You successfully connected to MongoDB!')
    } finally {
      // Ensures that the client will close when you finish/error
      await this.client.close()
    }
  }
}

const databaseService = new DatabaseService()
export default databaseService
