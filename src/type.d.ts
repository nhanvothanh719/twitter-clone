import User from './models/schemas/User.schema'
declare module 'express' {
  //MEMO: Extend Express's Request interface to include a custom `user` property
  interface Request {
    user?: User
  }
}
