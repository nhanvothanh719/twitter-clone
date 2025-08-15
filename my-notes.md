- Nếu `type` là retweet, comment hay quotetweet thì `parent_id` phải là `_id` của tweet cha.
- Nếu `type` là tweet thì `parent_id` phải là `null`

- Nếu `type` là retweet thì `content = ''`
- Nếu `type` là tweet, comment, hay quotetweet thì nội dung phải không được rỗng:
  - Nếu không có `mentions` hay `hashtags` thì `content` phải là string và length > 0.

- `hashtags: string[]`
- `mentions: ObjectId[]`
- `medias: Medias[]`

- Nếu `audience` của tweet là `Everyone` thì user chưa login cũng có thể xem được tweet.
- Nếu `audience` của tweet là `TwitterCircle` thì chỉ những user nằm trong `user.twitter_circle` mới có thể xem được => Phải đăng nhập
