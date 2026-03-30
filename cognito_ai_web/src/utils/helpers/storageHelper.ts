import CryptoJS from 'crypto-js';

// @ts-ignore
const SECRET_KEY: string = import.meta.env.VITE_STORAGE_KEY as string;

export function storeEncryptedData(key: string, data: unknown): void {
  try {
    const jsonString: string = JSON.stringify(data);
    const encrypted: string = CryptoJS.AES.encrypt(jsonString, SECRET_KEY).toString();
    sessionStorage.setItem(key, encrypted);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error encrypting and storing data:', err);
  }
}

export function getDecryptedData<T = unknown>(key: string): T | null {
  try {
    const encrypted: string | null = sessionStorage.getItem(key);
    if (!encrypted) return null;

    const bytes = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
    const decryptedString: string = bytes.toString(CryptoJS.enc.Utf8);
    const parsedData: unknown = JSON.parse(decryptedString);
    return JSON.parse(parsedData as string) as T;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error decrypting or parsing data:', err);
    return null;
  }
}
