import { User } from '@prisma/client'
import { decode } from 'jsonwebtoken'
import {
  saveGoalieRefreshToken,
  saveGoalieToken,
  saveGoalieUser
} from '../lib/util'
import { httpPost } from './_req'

export const signup = (data: Partial<User>) => {
  return httpPost('/api/auth/sign-up', data)
}

export interface ISignin {
  email: string
  password: string
  provider?: 'GOOGLE' | 'EMAIL_PASSWORD'
}

export const signin = ({
  email,
  password,
  provider = 'EMAIL_PASSWORD'
}: ISignin) => {
  return httpPost('/api/auth/sign-in', { email, password, provider })
    .then(res => {
      const { status, data } = res.data
      const { headers } = res

      console.log('headers', headers)
      console.log(status)

      if (status === 403) {
        return Promise.reject('NOT_ACTIVE')
      }

      if (status !== 200) {
        return Promise.reject('INVALID_INFORMATION')
      }

      const token = headers.authorization
      const refreshToken = headers.refreshtoken

      console.log('cache goalie token')
      saveGoalieToken(token)
      console.log('cache goalie refresh token')
      saveGoalieRefreshToken(refreshToken)

      // const decodeJWT = decode(token) as GoalieUser
      const decodeRefreshToken = decode(refreshToken) as { exp: number }

      console.log('cache goalie user info')
      saveGoalieUser({
        id: data.id,
        email: data.email,
        name: data.name,
        photo: data.photo,
        exp: decodeRefreshToken.exp // it should be `refreshToken expired`
      })

      return Promise.resolve('SUCCESS')
    })
    .catch(error => {
      console.log('error signin', error)
      return Promise.reject(error)
    })
}

export const resendVerifyEmail = (email: string) => {
  return httpPost('/api/auth/resend-verify-email', { email })
}

export const forgotPassword = (email: string) => {
  return httpPost('/api/auth/forgot-password', { email })
}

export interface ResetPasswordParams {
  token: string
  password: string
}

export const resetPassword = ({ token, password }: ResetPasswordParams) => {
  return httpPost('/api/auth/reset-password', { token, password })
    .then(res => {
      const { status } = res.data

      if (status !== 200) {
        return Promise.reject('RESET_PASSWORD_FAILED')
      }

      return Promise.resolve('SUCCESS')
    })
    .catch(error => {
      console.error('error reset password', error)
      return Promise.reject(error)
    })
} 
