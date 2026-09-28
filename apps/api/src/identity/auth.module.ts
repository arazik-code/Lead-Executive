import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';

@Module({ providers: [AuthGuard], controllers: [AuthController], exports: [AuthGuard] })
export class AuthModule {}
