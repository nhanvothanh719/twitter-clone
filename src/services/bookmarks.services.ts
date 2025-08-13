import Bookmark from '~/models/schemas/Bookmark.schema'
import databaseService from './database.services'
import { ObjectId, WithId } from 'mongodb'

class BookmarksService {
  async bookmarkTweet({ user_id, tweet_id }: { user_id: string; tweet_id: string }) {
    const userId = new ObjectId(user_id)
    const tweetId = new ObjectId(tweet_id)
    const result = await databaseService.bookmarks.findOneAndUpdate(
      { user_id: userId, tweet_id: tweetId },
      {
        $setOnInsert: new Bookmark({
          user_id: userId,
          tweet_id: tweetId
        })
      },
      {
        upsert: true,
        returnDocument: 'after'
      }
    )
    return result as WithId<Bookmark>
  }

  async removeBookmarkTweet({ user_id, tweet_id }: { user_id: string; tweet_id: string }) {
    const userId = new ObjectId(user_id)
    const tweetId = new ObjectId(tweet_id)
    const result = await databaseService.bookmarks.findOneAndDelete({ user_id: userId, tweet_id: tweetId })
    return result
  }
}

const bookmarksService = new BookmarksService()
export default bookmarksService
