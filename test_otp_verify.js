import { OTP } from 'otplib';
const auth = new OTP();
const secret = auth.generateSecret();
const uri = auth.generateURI({ issuer: 'ClickCamp', account: 'test@example.com', secret });
console.log('URI:', uri);
