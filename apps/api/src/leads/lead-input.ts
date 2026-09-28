import { BadRequestException } from '@nestjs/common';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

export function normalizeLeadPhone(value: string): string {
  const phone = parsePhoneNumberFromString(value, 'AE');
  if (!phone?.isValid()) throw new BadRequestException('Enter a valid phone number, including country code when outside the UAE');
  return phone.number;
}

export function validateBudget(amount?: number, currency?: string): void {
  if ((amount === undefined) !== (currency === undefined)) {
    throw new BadRequestException('Budget amount and currency must be provided together');
  }
}
