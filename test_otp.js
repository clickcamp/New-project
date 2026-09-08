import { OTP } from 'otplib';
try {
  const otp = new OTP();
  console.log("otp.generateSecret", typeof otp.generateSecret);
} catch (e) { console.error(e); }
