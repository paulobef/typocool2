import admin from 'firebase-admin'

declare namespace Express {
  export interface Request {
    user?: admin.auth.DecodedIdToken
  }
}

declare module "serviceAccount"
