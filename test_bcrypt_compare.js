import * as bcrypt from 'bcryptjs';
(async () => {
  const hash = await bcrypt.default.hash("malik123", 10);
  const isValid = await bcrypt.default.compare("malik123", hash);
  console.log('isValid:', isValid);
})();
