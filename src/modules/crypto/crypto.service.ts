import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

@Injectable()
export class CryptoService {
  constructor(private readonly configService: ConfigService) {}

  async encryptPassword(password: string) {
    const iv = randomBytes(16);
    const salt =
      this.configService.get<string>('CRYPTO_SECRET_KEY') || 'CRYOTO';
    const key = (await promisify(scrypt)(salt, 'salt', 32)) as Buffer;

    const cipher = createCipheriv('aes-256-ctr', key, iv);

    const encryptedBuffer = Buffer.concat([
      cipher.update(password),
      cipher.final(), // Always finalize, even in CTR mode
    ]);

    // Combine IV + Encrypted
    return Buffer.concat([iv, encryptedBuffer]).toString('base64');
  }

  async decryptPassword(payload: string): Promise<string> {
    const rawData = Buffer.from(payload, 'base64');

    const iv = rawData.slice(0, 16); // First 16 bytes
    const encryptedBuffer = rawData.slice(16); // Remaining bytes

    const salt =
      this.configService.get<string>('CRYPTO_SECRET_KEY') || 'CRYOTO';
    const key = (await promisify(scrypt)(salt, 'salt', 32)) as Buffer;
    const decipher = createDecipheriv('aes-256-ctr', key, iv);

    const decrypted = Buffer.concat([
      decipher.update(encryptedBuffer),
      decipher.final(), // Always call to finalize decryption
    ]);

    return decrypted.toString(); // Return as UTF-8 string
  }
}
