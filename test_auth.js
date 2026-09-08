import { OTP, authenticator } from 'otplib';
try {
  console.log("OTP", typeof OTP);
  console.log("authenticator", typeof authenticator);
  const otp = new OTP();
  console.log("otp.generateSecret", typeof otp.generateSecret);
} catch (e) { console.error(e); }
