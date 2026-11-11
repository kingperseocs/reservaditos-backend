import { Injectable } from '@nestjs/common';
import { randomInt, randomUUID } from 'node:crypto';
import { RandomGenerator } from '../../domain/ports';

@Injectable()
export class CryptoRandomGenerator implements RandomGenerator {
  uuid(): string {
    return randomUUID();
  }

  digits(length: number): string {
    return randomInt(0, 10 ** length)
      .toString()
      .padStart(length, '0');
  }
}
