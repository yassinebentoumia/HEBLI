// ============================================================
// HEBLI – Professional Biometric Auth (WebAuthn / Face ID)
// Uses the device's actual secure enclave (Apple Face ID, Android Face Unlock)
// ============================================================

const RP_NAME = 'HEBLI Coffee';
const STORAGE_PREFIX = 'hebli_biometric_';

function getRpId() {
  const host = window.location.hostname;
  // WebAuthn requires a valid domain or localhost.
  if (host === 'localhost' || host === '127.0.0.1') return host;
  // For production (Render), use the actual domain.
  return host;
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return btoa(String.fromCharCode(...bytes));
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export interface BiometricCredential {
  credentialId: string;
  staffId: string;
  staffName: string;
}

export function getStoredCredential(staffId: string): BiometricCredential | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + staffId);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveCredential(cred: BiometricCredential) {
  localStorage.setItem(STORAGE_PREFIX + cred.staffId, JSON.stringify(cred));
}

export function clearCredential(staffId: string) {
  localStorage.removeItem(STORAGE_PREFIX + staffId);
}

export async function isBiometricSupported(): Promise<boolean> {
  if (!window.PublicKeyCredential) return false;
  try {
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch { return false; }
}

// 1. REGISTER: Owner sets up Face ID for a staff member
export async function registerBiometric(staffId: string, staffName: string): Promise<void> {
  const supported = await isBiometricSupported();
  if (!supported) throw new Error('This device does not support Face ID / Biometrics.');

  clearCredential(staffId);

  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userId = new TextEncoder().encode(staffId);

  const publicKey: PublicKeyCredentialCreationOptions = {
    challenge,
    rp: { name: RP_NAME, id: getRpId() },
    user: { id: userId, name: staffName, displayName: staffName },
    pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
    authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
    timeout: 60000,
  };

  const credential = await navigator.credentials.create({ publicKey }) as PublicKeyCredential;
  saveCredential({ credentialId: bufferToBase64(credential.rawId), staffId, staffName });
}

// 2. VERIFY: Staff scans face to login
export async function verifyBiometric(staffId: string): Promise<boolean> {
  const stored = getStoredCredential(staffId);
  if (!stored) throw new Error('Face ID not registered for this staff member on this device.');

  const challenge = crypto.getRandomValues(new Uint8Array(32));
  
  const publicKey: PublicKeyCredentialRequestOptions = {
    challenge,
    allowCredentials: [{ type: 'public-key', id: base64ToBuffer(stored.credentialId) }],
    userVerification: 'required',
    timeout: 60000,
    rpId: getRpId(),
  };

  const assertion = await navigator.credentials.get({ publicKey }) as PublicKeyCredential | null;
  return assertion !== null;
}
