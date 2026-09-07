const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const webAuthnCode = `
import { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } from '@simplewebauthn/server';
const rpName = 'ClickCamp Workspace';
const rpID = 'localhost'; // In production, this should be the domain
const expectedOrigin = [
  'http://localhost:3000', 
  'https://ais-dev-lvfvxm2hdgwh55boq2xmrr-314695820503.asia-southeast1.run.app', 
  'https://ais-pre-lvfvxm2hdgwh55boq2xmrr-314695820503.asia-southeast1.run.app'
];
const userChallenges = new Map(); // userId -> challenge

app.post('/api/webauthn/generate-registration-options', (req, res) => {
  const { userId, userEmail } = req.body;
  const options = generateRegistrationOptions({
    rpName,
    rpID,
    userID: userId,
    userName: userEmail,
    attestationType: 'none',
    authenticatorSelection: {
      residentKey: 'discouraged',
      userVerification: 'preferred',
    },
  });
  userChallenges.set(userId, options.challenge);
  res.json(options);
});

app.post('/api/webauthn/verify-registration', async (req, res) => {
  const { userId, body } = req.body;
  const expectedChallenge = userChallenges.get(userId);
  if (!expectedChallenge) return res.status(400).json({ error: "Challenge not found" });

  try {
    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin,
      expectedRPID: rpID,
    });
    const { verified, registrationInfo } = verification;
    if (verified && registrationInfo) {
      res.json({ verified: true, registrationInfo });
    } else {
      res.status(400).json({ error: "Verification failed" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/webauthn/generate-authentication-options', (req, res) => {
  const { userId, allowCredentials } = req.body;
  const options = generateAuthenticationOptions({
    rpID,
    allowCredentials: allowCredentials.map(cred => ({
      id: cred.credentialID, // base64url expected
      type: 'public-key',
      transports: cred.transports,
    })),
    userVerification: 'preferred',
  });
  userChallenges.set(userId, options.challenge);
  res.json(options);
});

app.post('/api/webauthn/verify-authentication', async (req, res) => {
  const { userId, body, authenticator } = req.body;
  // authenticator = { credentialID, credentialPublicKey, counter, transports }
  const expectedChallenge = userChallenges.get(userId);
  if (!expectedChallenge) return res.status(400).json({ error: "Challenge not found" });

  // The client passes back the stored public key buffer (base64url)
  // Let's decode it inside simplewebauthn or verifyAuthenticationResponse will do it.
  try {
    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin,
      expectedRPID: rpID,
      authenticator: {
         // simplewebauthn expects uint8arrays, so we must parse the base64 string sent by the client
         credentialID: new Uint8Array(Buffer.from(authenticator.credentialID, 'base64url')),
         credentialPublicKey: new Uint8Array(Buffer.from(authenticator.credentialPublicKey, 'base64url')),
         counter: authenticator.counter,
      },
    });

    if (verification.verified) {
      // Return updated counter so client can update DB
      res.json({ verified: true, authenticationInfo: verification.authenticationInfo });
    } else {
      res.status(400).json({ error: "Verification failed" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

import bcrypt from 'bcryptjs';

app.post('/api/admin/login', async (req, res) => {
  const { password, storedHash } = req.body;
  // In a real app, the server would query the DB for the hash.
  // For this prototype, the client queries Firestore and passes the hash to the server to verify.
  const isValid = await bcrypt.compare(password, storedHash);
  if (isValid) {
    res.json({ success: true, token: 'admin-jwt-token-mock' });
  } else {
    res.status(401).json({ error: "Invalid password" });
  }
});
`;

code = code.replace(
  'const app = express();',
  webAuthnCode + '\nconst app = express();'
);

fs.writeFileSync('server.ts', code);
console.log("server.ts patched with WebAuthn endpoints");
