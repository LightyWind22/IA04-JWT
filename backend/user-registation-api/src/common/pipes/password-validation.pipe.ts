import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

@Injectable()
export class PasswordValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (!value.password) {
      throw new BadRequestException('Password is required');
    }

    // Check password length
    if (value.password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters long');
    }

    // Check for at least one number
    if (!/\d/.test(value.password)) {
      throw new BadRequestException('Password must contain at least one number');
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(value.password)) {
      throw new BadRequestException('Password must contain at least one uppercase letter');
    }

    return value;
  }
}