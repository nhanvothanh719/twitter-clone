import { Collection, Db, MongoClient } from 'mongodb'
import { config } from 'dotenv'
import User from '~/models/schemas/User.schema'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import Follower from '~/models/schemas/Follower.schema'
import Tweet from '~/models/schemas/Tweet.schema'

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
  get tweets(): Collection<Tweet> {
    return this.db.collection(process.env.DB_TWEETS_COLLECTION as string)
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

  async addIndexToUsersCollection() {
    // Check and create compound index (email_1_password_1) on `email` and `password` fields in ascending order
    const hasCompoundIndex = await this.users.indexExists('email_1_password_1')
    if (!hasCompoundIndex) this.users.createIndex({ email: 1, password: 1 })

    // Check and create single index on the `email` and `username` field in ascending order with unique constraint
    const hasEmailIndex = await this.users.indexExists('email_1')
    if (!hasEmailIndex) this.users.createIndex({ email: 1 }, { unique: true })

    const hasUsernameIndex = await this.users.indexExists('email_1')
    if (!hasUsernameIndex) this.users.createIndex({ username: 1 }, { unique: true })
  }

  async addIndexToRefreshTokensCollection() {
    const hasTokenIndex = await this.refreshTokens.indexExists('token_1')
    if (!hasTokenIndex) this.refreshTokens.createIndex({ token: 1 })

    // MEMO: Check and create Time-To-Live (TTL) index
    const hasTimeToLiveExpIndex = await this.refreshTokens.indexExists('exp_1')
    // MEMO: MongoDB will delete document automatically when the value of `exp` field <= current time
    // MEMO: expireAfterSeconds: 0 means deletion occurs as soon as `exp` is reached (±60s delay due to TTL monitor)
    if (!hasTimeToLiveExpIndex) this.refreshTokens.createIndex({ exp: 1 }, { expireAfterSeconds: 0 })
  }

  async addIndexToFollowersCollection() {
    const hasCompoundIndex = await this.followers.indexExists('user_id_1_followed_user_id_1')
    if (!hasCompoundIndex) this.followers.createIndex({ user_id: 1, followed_user_id: 1 })
  }
}

const databaseService = new DatabaseService()
export default databaseService
