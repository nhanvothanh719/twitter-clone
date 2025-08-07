import User from '~/models/schemas/User.schema'
import databaseService from './database.services'

class UsersService {
  async register(payload: { email: string; password: string }) {
    const { email, password } = payload
    const user = new User({ email, password })
    const result = await databaseService.users.insertOne(user)
    return result
  }

  async isUnqueEmail(email: string) {
    const userWithCheckedEmail = await databaseService.users.findOne({ email })
    return !userWithCheckedEmail
  }
}

const usersService = new UsersService()
export default usersService
