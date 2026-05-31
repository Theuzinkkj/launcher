/* ===== ATLAS CRYPTO — Web Crypto API Manager ===== */
const CryptoManager = (() => {
  const ENC = new TextEncoder();
  const DEC = new TextDecoder();

  function b64(buf) {
    return btoa(String.fromCharCode(...new Uint8Array(buf)));
  }
  function unb64(str) {
    return Uint8Array.from(atob(str), c => c.charCodeAt(0));
  }

  async function deriveKey(password, salt) {
    const keyMat = await crypto.subtle.importKey(
      'raw', ENC.encode(password), { name: 'PBKDF2' }, false, ['deriveKey']
    );
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      keyMat,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async function hashPassword(password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await deriveKey(password, salt);
    // Store a verification token encrypted with the key
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const cipher = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      ENC.encode('atlas_vault_verify')
    );
    const hash = b64(iv) + ':' + b64(cipher);
    return { hash, salt: b64(salt) };
  }

  async function verifyPassword(password, storedHash, storedSalt) {
    try {
      const salt = unb64(storedSalt);
      const key = await deriveKey(password, salt);
      const [ivB64, cipherB64] = storedHash.split(':');
      const iv = unb64(ivB64);
      const cipher = unb64(cipherB64);
      const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
      return DEC.decode(plain) === 'atlas_vault_verify';
    } catch { return false; }
  }

  async function encrypt(text, password) {
    try {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const key = await deriveKey(password, salt);
      const cipher = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        ENC.encode(text)
      );
      return b64(salt) + '.' + b64(iv) + '.' + b64(cipher);
    } catch (e) { throw new Error('Encryption failed: ' + e.message); }
  }

  async function decrypt(encryptedData, password) {
    try {
      const [saltB64, ivB64, cipherB64] = encryptedData.split('.');
      const salt = unb64(saltB64);
      const iv = unb64(ivB64);
      const cipher = unb64(cipherB64);
      const key = await deriveKey(password, salt);
      const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
      return DEC.decode(plain);
    } catch (e) { throw new Error('Decryption failed: ' + e.message); }
  }

  return { hashPassword, verifyPassword, encrypt, decrypt };
})();
