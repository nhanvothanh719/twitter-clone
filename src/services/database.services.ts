import { Collection, Db, MongoClient } from 'mongodb'
import { config } from 'dotenv'
import User from '~/models/schemas/User.schema'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import Follower from '~/models/schemas/Follower.schema'

// MEMO: Load `.env` file
config()

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
  get refreshTokens(): Collection<RefreshToken> {
    return this.db.collection(process.env.DB_REFRESH_TOKENS_COLLECTION as string)
  }
  get followers(): Collection<Follower> {
    return this.db.collection(process.env.DB_FOLLOWERS_COLLECTION as string)
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

  addIndexToUsersCollection() {
    // Create compound index (email_1_password_1) on `email` and `password` fields in ascending order
    this.users.createIndex({ email: 1, password: 1 })
    // Create single index on the `email` and `username` field in ascending order with unique constraint
    this.users.createIndex({ email: 1 }, { unique: true })
    this.users.createIndex({ username: 1 }, { unique: true })
  }

  addIndexToRefreshTokensCollection() {
    this.refreshTokens.createIndex({ token: 1 })
    // MEMO: Create Time-To-Live (TTL) index
    // MEMO: MongoDB will delete document automatically when the value of `exp` field <= current time
    // MEMO: expireAfterSeconds: 0 means deletion occurs as soon as `exp` is reached (±60s delay due to TTL monitor)
    this.refreshTokens.createIndex({ exp: 1 }, { expireAfterSeconds: 0 })
  }

  addIndexToFollowersCollection() {
    // MEMO: Create compound index
    this.followers.createIndex({ user_id: 1, followed_user_id: 1 })
  }
}

const databaseService = new DatabaseService()
export default databaseService
