import { Module } from '@nestjs/common';
import { HashingProvider } from './providers/bcrypt.provider';

@Module({
    providers: [HashingProvider],
    exports: [HashingProvider]
})
export class AuthModule {}
