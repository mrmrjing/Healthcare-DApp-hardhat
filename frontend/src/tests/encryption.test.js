const { ec: EC } = require('elliptic');
const CryptoJS = require('crypto-js');
const crypto = require('crypto');

// Utility function for deriving keys
const deriveKey = (password) => {
  const salt = CryptoJS.enc.Hex.parse('a9b8c7d6e5f4a3b2');
  return CryptoJS.PBKDF2(password, salt, { keySize: 256 / 32, iterations: 1000 });
};

// Utility function for deriving AES keys
const deriveAESKey = (sharedSecretHex, keyLength = 32) => {
  const paddedKey = sharedSecretHex.padStart(keyLength * 2, '0').slice(0, keyLength * 2);
  return CryptoJS.enc.Hex.parse(paddedKey);
};

// Test for consistent key derivation
test('deriveKey generates consistent key for the same password', () => {
  const password = 'testpassword';
  const key1 = deriveKey(password);
  const key2 = deriveKey(password);

  expect(key1.toString()).toEqual(key2.toString());
});

// Test for symmetric key encryption and decryption using elliptic curve
test('encrypt and decrypt symmetric key', () => {
  const ec = new EC('secp256k1');

  // Generate key pairs
  const patientKeyPair = ec.genKeyPair({
    entropy: crypto.randomBytes(32).toString('hex'),
  });
  const doctorKeyPair = ec.genKeyPair({
    entropy: crypto.randomBytes(32).toString('hex'),
  });

  // Symmetric key
  const symmetricKey = CryptoJS.lib.WordArray.random(32);
  const symmetricKeyHex = symmetricKey.toString(CryptoJS.enc.Hex);

  // Derive shared secrets
  const sharedSecretEncryption = patientKeyPair.derive(doctorKeyPair.getPublic());
  const sharedSecretDecryption = doctorKeyPair.derive(patientKeyPair.getPublic());

  // Ensure shared secrets match
  expect(sharedSecretEncryption.toString(16)).toEqual(sharedSecretDecryption.toString(16));

  // Derive AES key
  const aesKey = deriveAESKey(sharedSecretEncryption.toString(16));
  const iv = CryptoJS.enc.Hex.parse('101112131415161718191a1b1c1d1e1f');

  // Encrypt symmetric key
  const encryptedSymmetricKey = CryptoJS.AES.encrypt(symmetricKeyHex, aesKey, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  }).toString();

  // Decrypt symmetric key
  const decryptedBytes = CryptoJS.AES.decrypt(encryptedSymmetricKey, aesKey, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  const decryptedSymmetricKeyHex = decryptedBytes.toString(CryptoJS.enc.Utf8);

  // Ensure decrypted key matches original
  expect(decryptedSymmetricKeyHex).toEqual(symmetricKeyHex);
});

// Test for encrypting and decrypting file data
test('encrypt and decrypt file data', () => {
  const symmetricKey = CryptoJS.lib.WordArray.random(32);
  const iv = CryptoJS.enc.Hex.parse('101112131415161718191a1b1c1d1e1f');

  // Sample file data
  const fileData = CryptoJS.enc.Utf8.parse('Sample file content');

  // Encrypt file data
  const encryptedFile = CryptoJS.AES.encrypt(fileData, symmetricKey, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  // Decrypt file data
  const decryptedBytes = CryptoJS.AES.decrypt(encryptedFile.toString(), symmetricKey, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  const decryptedContent = decryptedBytes.toString(CryptoJS.enc.Utf8);

  // Ensure decrypted content matches original
  expect(decryptedContent).toEqual('Sample file content');
});

// Test edge cases for encryption and decryption
test('decrypting with wrong key or IV fails', () => {
    const symmetricKey = CryptoJS.lib.WordArray.random(32);
    const wrongKey = CryptoJS.lib.WordArray.random(32); // Different key
    const iv = CryptoJS.enc.Hex.parse('101112131415161718191a1b1c1d1e1f');
    const wrongIv = CryptoJS.enc.Hex.parse('00112233445566778899aabbccddeeff'); // Different IV
  
    const fileData = CryptoJS.enc.Utf8.parse('Sensitive data');
  
    // Encrypt file data
    const encryptedFile = CryptoJS.AES.encrypt(fileData, symmetricKey, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    }).toString();
  
    // Attempt decryption with wrong key
    let decryptionWithWrongKey;
    try {
      decryptionWithWrongKey = CryptoJS.AES.decrypt(encryptedFile, wrongKey, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }).toString(CryptoJS.enc.Utf8);
    } catch (error) {
      decryptionWithWrongKey = null; // Ensure we fail gracefully
    }
  
    // Attempt decryption with wrong IV
    let decryptionWithWrongIv;
    try {
      decryptionWithWrongIv = CryptoJS.AES.decrypt(encryptedFile, symmetricKey, {
        iv: wrongIv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }).toString(CryptoJS.enc.Utf8);
    } catch (error) {
      decryptionWithWrongIv = null; // Ensure we fail gracefully
    }
  
    // Ensure incorrect decryption results
    expect(decryptionWithWrongKey).not.toEqual('Sensitive data');
    expect(decryptionWithWrongIv).not.toEqual('Sensitive data');
  });

  
  
  