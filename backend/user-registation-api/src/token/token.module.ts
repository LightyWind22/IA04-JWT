import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { TokenService } from './token.service';
import { Mongoose } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';
import { RefreshToken, RefreshTokenSchema } from './schemas/refreshToken.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: RefreshToken.name, schema: RefreshTokenSchema }
        ]),
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'nosecretkeyfounded',
            signOptions: { expiresIn: '1h' },
        }),
    ],
    controllers: [],
    providers: [TokenService],
    exports: [TokenService],
})
export class TokenModule {}