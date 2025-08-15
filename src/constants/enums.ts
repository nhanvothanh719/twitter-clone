export enum UserVerifyStatus {
  Unverified,
  Verified,
  Banned
}

export enum TokenType {
  AccessToken,
  RefreshToken,
  ForgotPasswordToken,
  EmailVerifyToken
}

export enum MediaType {
  Image,
  Video,
  HLS //TODO:
}

export enum MediaTypeSearchString {
  Image = 'image',
  Video = 'video'
}

export enum TweetAudience {
  Everyone,
  TwitterCircle
}

export enum TweetType {
  Tweet,
  Retweet,
  Comment,
  QuoteTweet
}
