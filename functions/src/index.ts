import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin'
import express, { RequestHandler, Request, Response } from "express"
import _cookieParser from 'cookie-parser'
import _cors from 'cors'
import { EventContext } from 'firebase-functions'
import { QueryDocumentSnapshot } from 'firebase-functions/lib/providers/firestore'

const cors = _cors({origin: '*'})
const cookieParser = _cookieParser()
const app = express();
const serviceAccount = require('../typocool2-firebase-adminsdk-hwest-361a95ea6b.json')

// UTILS

function createToken() {
   return Math.floor(1000000000000000 + Math.random() * 9000000000000000)
      .toString(36).substr(0, 10)
}

// MIDDLEWARE

const validateFirebaseIdToken: RequestHandler = async (req: Request, res: Response, next) => {
  console.log('Check if request is authorized with Firebase ID token');

  if ((!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) &&
    !(req.cookies && req.cookies.__session)) {
    console.error('No Firebase ID token was passed as a Bearer token in the Authorization header.',
      'Make sure you authorize your request by providing the following HTTP header:',
      'Authorization: Bearer <Firebase ID Token>',
      'or by passing a "__session" cookie.');
    res.status(403).send('Unauthorized');
    return;
  }

  let idToken;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    console.log('Found "Authorization" header');
    // Read the ID Token from the Authorization header.
    idToken = req.headers.authorization.split('Bearer ')[1];
  } else if(req.cookies) {
    console.log('Found "__session" cookie');
    // Read the ID Token from cookie.
    idToken = req.cookies.__session;
  } else {
    // No cookie
    res.status(403).send('Unauthorized');
    return;
  }

  try {
    const decodedIdToken = await admin.auth().verifyIdToken(idToken);
    console.log('ID Token correctly decoded', decodedIdToken);
    // @ts-ignore FIXME: should work because of index.d.ts but doesn't
    req.user = decodedIdToken;
    next();
    return;
  } catch (error) {
    console.error('Error while verifying Firebase ID token:', error);
    res.status(403).send('Unauthorized');
    return;
  }
};

// FUNCTIONS

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const generateToken = async (tokenRef: FirebaseFirestore.DocumentReference) => {
  const token1 = createToken() + Date.now()
  const token2 = createToken() + Date.now()
  const writeResult = await tokenRef.set({
    editor: token1,
    viewer: token2
  })
  return writeResult.writeTime

}

// function triggered by inserting a new document
export const onCreateDocMeta = functions.firestore.document('/metas/{documentId}')
  .onCreate(async (snap: QueryDocumentSnapshot, context: EventContext): Promise<void> => {
    const tokenRef = await admin.firestore().collection('tokens').doc(context.params.docId)
    const writeTime = await generateToken(tokenRef)
    functions.logger.log('Writing tokens', writeTime, context.params.docId);
  })

// https endpoints use expressJS
app.use(cors);
app.use(cookieParser);
app.use(validateFirebaseIdToken);
app.get('/getShareLinks/:docId/:editor', async (req, res) => {
  // @ts-ignore FIXME
  if (!req.user) {
    functions.logger.log("no user provided")
    res.status(403).send('Unauthorized')
    return
  }
  // @ts-ignore
  functions.logger.log(typeof req.user)
  const docId = req.params.docId
  if (!docId) {
    functions.logger.log("no docId provided, docId: " + docId)
    res.status(404).send('Not Found')
    return
  }
  functions.logger.log("docId provided, docId: " + docId)
  // verify that the user requesting the link is the owner or an editor
  const metaSnap = await admin.firestore().collection('metas').doc(docId).get()
  if (!metaSnap || !metaSnap.data()) return
  const meta = metaSnap.data()
  if (!meta) return
  functions.logger.log(meta)
  // @ts-ignore FIXME
  if (req.user.uid !== meta.creator && !meta.editors.includes(req.user.user_id || req.user.uid)) {
    functions.logger.log('User does not own the doc, Unauthorized')
    return res.status(403).send('Unauthorized');
  }
  // user is authorized, we send the share link
  const tokensSnap = await admin.firestore().collection('tokens').doc(docId).get()
  const tokens = tokensSnap.data()
  if (!tokens) return res.status(404).send('This resource has no associated share links');
  const token = req.params.editor ? tokens.editor : tokens.viewer
  res.json({ link: `http://localhost:3000/${docId}/${token}`})
  return
});

app.post('/addTokens/:docId', async (req, res) => {
  const tokenRef = await admin.firestore().collection('tokens').doc(req.params.docId)
  const tokensSnap = await tokenRef.get()
  if (!tokensSnap) {
    const writeTime = await generateToken(tokenRef)
    functions.logger.log('Writing tokens', writeTime, req.params.docId);
    res.status(200).send('Successfully generated the tokens')
    return
  }
  const tokens = tokensSnap.data()
  if (!(tokens && (tokens.editors || tokens.viewers))) {
    const writeTime = await generateToken(tokenRef)
    functions.logger.log('Writing tokens', writeTime, req.params.docId);
    res.status(200).send('Successfully generated the tokens')
    return
  }
  res.status(208).send('Tokens already exist in the database')
  return
})

app.post('/addPermission/:docId/:token', async (req, res) => {

  // @ts-ignore FIXME
  if (!req.user) {
    functions.logger.log("no user provided through validation middleware")
    res.status(403).send('Unauthorized')
    return
  }

  const { docId, token } = req.params
  if (!docId || !token) {
    res.status(404).send('Not Found');
    return
  }

  // get tokens and compare with provided token
  const tokenSnap = await admin.firestore().collection('tokens').doc(docId).get()
  if (!tokenSnap) { res.status(404).send('Not Found'); return }
  const tokens = tokenSnap.data()
  if(!tokens) { res.status(404).send('Not Found'); return }
  const metaRef = admin.firestore().collection('metas').doc(docId)

  const metaSnap = await metaRef?.get()
  if (!metaSnap) {
    res.status(404).send('Not Found');
    return
  }
  const meta = await metaSnap.data()
  if (!meta) {
    res.status(404).send('Not Found');
    return
  }
  // @ts-ignore FIXME
  if (req.user.uid === meta.creator) {
    functions.logger.log("user is doc's creator")
    res.status(200).send("Success")
    return
  } else if (token === tokens.editor) {
    await metaRef.update({
      // @ts-ignore FIXME
      editors: admin.firestore.FieldValue.arrayUnion(req.user.uid)
    })
    functions.logger.log('token matches editor token')
    res.status(200).send("Success")
    return
  } else if (token === tokens.viewer) {
    await metaRef.update({
      // @ts-ignore FIXME
      viewers: admin.firestore.FieldValue.arrayUnion(req.user.uid)
    })
    functions.logger.log('token matches viewer token')
    res.status(200).send("Success")
    return
  } else {
    functions.logger.log('token does not match', 'token given: ' + token, 'editor token: ' + tokens.editor, 'viewer token: ' + tokens.viewer)
    res.status(403).send('Unauthorized')
    return
  }


})


export default functions.https.onRequest(app)
