// AES-256-GCM encryption with a key derived from the user's journal passphrase.
// The passphrase / key is NEVER stored. Only the salt and an encrypted check value are.
const crypto = require('crypto');
const { promisify } = require('util');
const scrypt = promisify(crypto.scrypt);

const CHECK = 'mindwell-ok';

// 32-byte key (AES-256) from passphrase + per-user salt
const deriveKey = (passphrase, saltHex) =>
  scrypt(passphrase, Buffer.from(saltHex, 'hex'), 32);

// Output format: iv:authTag:ciphertext (all base64) -> looks like gibberish in the DB
function encrypt(plain, key) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, data].map((b) => b.toString('base64')).join(':');
}

function decrypt(payload, key) {
  const [iv, tag, data] = payload.split(':').map((s) => Buffer.from(s, 'base64'));
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

module.exports = { deriveKey, encrypt, decrypt, CHECK };
