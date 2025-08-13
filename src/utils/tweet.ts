import { TweetType } from '~/constants/enums'

export const isNormalTweetType = (type: TweetType): boolean => {
  return type === TweetType.Tweet
}

export const isRetweetType = (type: TweetType): boolean => {
  return type === TweetType.Retweet
}

export const isQuoteTweetType = (type: TweetType): boolean => {
  return type === TweetType.QuoteTweet
}

export const isCommentType = (type: TweetType): boolean => {
  return type === TweetType.Comment
}

export const isRetweetOrQuoteTweetOrCommentType = (type: TweetType): boolean => {
  return isRetweetType(type) || isQuoteTweetType(type) || isCommentType(type)
}

export const isTweetOrQuoteTweetOrCommentType = (type: TweetType): boolean => {
  return isNormalTweetType(type) || isQuoteTweetType(type) || isCommentType(type)
}
