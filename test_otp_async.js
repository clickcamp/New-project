import { OTP } from 'otplib';
(async () => {
  const auth = new OTP();
  const secret = auth.generateSecret();
  const token = auth.generateSync({ secret });
  const result = await auth.verify({ token, secret });
  console.log('Async Result type:', typeof result);
  console.log('Async Result:', result);
})();
