import bcrypt from 'bcryptjs';

export const hashPassword = (pwd) => bcrypt.hash(pwd, 10);
export const comparePassword = (pwd, hash) => bcrypt.compare(pwd, hash);

export function generateReferralCode(){
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'KTN';
  for(let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}