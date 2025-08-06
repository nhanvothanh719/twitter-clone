import { Collection, Db, MongoClient } from 'mongodb'
import dotenv from 'dotenv'
import User from '~/models/schemas/User.schema'

// MEMO: Load `.env` file
dotenv.config()

const dbName = process.env.DB_NAME
const dbUsername = process.env.DB_USERNAME
const dbPassword = process.env.DB_PASSWORD
const dbConnectURI = `mongodb+srv://${dbUsername}:${dbPassword}@twitterclonecluster.rpihvgj.mongodb.net/?retryWrites=true&w=majority&appName=TwitterCloneCluster`

class DatabaseService {
  private client: MongoClient
  private db: Db

  constructor() {
    this.client = new MongoClient(dbConnectURI)
    this.db = this.client.db(dbName)
  }

  get users(): Collection<User> {
    return this.db.collection(process.env.DB_USERS_COLLECTION as string)
  }

  async checkDBConnection() {
    try {
      // Send a ping to confirm a successful connection
      await this.db.command({ ping: 1 })
      console.log('Pinged your deployment. You successfully connected to MongoDB!')
    } catch (error) {
      console.error('Error in connecting to database: ', error)
      throw error
    }
  }
}

const databaseService = new DatabaseService()
export default databaseService
