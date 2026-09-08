import * as bcrypt from 'bcryptjs';
console.log('bcrypt.default:', typeof bcrypt.default);
console.log('bcrypt.hash:', typeof bcrypt.hash);
console.log('bcrypt.default.hash:', bcrypt.default ? typeof bcrypt.default.hash : 'undefined');
