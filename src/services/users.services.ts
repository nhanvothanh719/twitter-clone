import User from '~/models/schemas/User.schema'
import databaseService from './database.services'
import { UserRegistrationRequestBody } from '~/models/schemas/requests/User.requests'

class UsersService {
  async register(payload: UserRegistrationRequestBody) {
    const user = new User({ ...payload, date_of_birth: new Date(payload.date_of_birth) })
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
