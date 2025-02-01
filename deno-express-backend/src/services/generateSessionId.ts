import randomBytes from 'npm:randombytes';

export function generateSessionId(): string {
  const bytes = randomBytes(16);
  
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  
  return bytes
    .toString('hex')
    .match(/.{2}/g)!
    .join('')
    .replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
}