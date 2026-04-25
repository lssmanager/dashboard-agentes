/**
 * CryptoService
 * AES-256-GCM encryption/decryption for credentials stored in DB.
 * Key loaded from MASTER_ENCRYPTION_KEY env (64 hex chars = 32 bytes).
 * Never logs plaintext. Never throws on decrypt — returns empty string on failure.
 */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const TAG_BYTES = 16;

@Injectable()
export class CryptoService implements OnModuleInit {
  private readonly logger = new Logger(CryptoService.name);
  private key!: Buffer;

  onModuleInit(): void {
    const hexKey = process.env.MASTER_ENCRYPTION_KEY ?? '';
    if (hexKey.length !== 64) {
      this.logger.error(
        'MASTER_ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes). Credentials will not be encrypted correctly.',
      );
    }
    this.key = Buffer.from(hexKey.padEnd(64, '0'), 'hex');
  }

  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(IV_BYTES);
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    // Format: iv(hex):tag(hex):ciphertext(hex)
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  decrypt(ciphertext: string): string {
    try {
      const [ivHex, tagHex, dataHex] = ciphertext.split(':');
      if (!ivHex || !tagHex || !dataHex) return '';
      const iv = Buffer.from(ivHex, 'hex');
      const tag = Buffer.from(tagHex, 'hex');
      const data = Buffer.from(dataHex, 'hex');
      const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv);
      decipher.setAuthTag(tag);
      return decipher.update(data) + decipher.final('utf8');
    } catch {
      this.logger.warn('Decryption failed — returning empty string');
      return '';
    }
  }

  /** Encrypt a JSON object */
  encryptJson(obj: Record<string, unknown>): string {
    return this.encrypt(JSON.stringify(obj));
  }

  /** Decrypt a JSON object */
  decryptJson<T = Record<string, unknown>>(ciphertext: string): T | null {
    try {
      return JSON.parse(this.decrypt(ciphertext)) as T;
    } catch {
      return null;
    }
  }
}
