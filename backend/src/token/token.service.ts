import { Injectable, ConflictException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { RefreshToken, RefreshTokenDocument } from './schemas/refreshToken.schema';
import { Model } from 'mongoose';

@Injectable()
export class TokenService {
    constructor(
        private readonly jwtService: JwtService,
        @InjectModel(RefreshToken.name) private refreshTokenModel: Model<RefreshTokenDocument>,
    ) {};

    // Validate refresh token
    async validateRefreshToken(user: User, refreshToken: string): Promise<boolean> {
        // Find all refresh tokens record by user ID
        const tokenRecord = await this.refreshTokenModel.find({
             userId: user._id,
             revoked: false,
            });

        // Check if there is any non-revoked token
        if (!tokenRecord || tokenRecord.length === 0) {
            throw new UnauthorizedException('Access Denied. No active tokens found');
        }

        // Check if exists a valid refresh token
        let validTokenRecord: RefreshTokenDocument | null = null;
        // Flag to indicate if token is valid
        for (const record of tokenRecord) {
            const isMatch = await bcrypt.compare(refreshToken, record.tokenHash);
            if (isMatch) {
                validTokenRecord = record;
                break; // Found a matching token, exit the loop
            }
        }

        // Determine if token is valid
        if (!validTokenRecord) {
            throw new UnauthorizedException('Access Denied. Token mismatch.');
        }

        // Check if token is expired
        if (validTokenRecord.expiresAt < new Date()) {
            throw new UnauthorizedException('Access Denied. Token expired.');
        }

        return validTokenRecord ? true : false;
    }

    async revokeRefreshToken(user: User): Promise<void> {
        await this.refreshTokenModel.deleteMany({ userId: user._id });
    }

    async generateAccessToken(user: User): Promise<string> {
        // Generate JWT payload
        const payload = { email: user.email, sub: user._id.toString() };

        // Generate access token by JWT
        return this.jwtService.sign(payload, {
            secret: process.env.JWT_SECRET || 'nosecretkeyfounded',
            expiresIn: '5m',
        });
    }

    async generateTokens(user: User): Promise<{accessToken: string, newRefreshToken: string}> {
        // Generate access token
        const accessToken = await this.generateAccessToken(user);

        // Generate refresh token by random UUID
        const newRefreshToken = randomUUID();
        const tokenHash = await bcrypt.hash(newRefreshToken, 10);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        // Add refresh token in database
        const refreshTokenInfo = new this.refreshTokenModel({
            userId: user._id,
            tokenHash,
            expiresAt
        });

        await refreshTokenInfo.save();

        return { accessToken, newRefreshToken }
    }

        // Find and return the user document associated with a raw refresh token (if valid)
        async findUserByRefreshToken(refreshToken: string): Promise<any | null> {
            const tokenRecords = await this.refreshTokenModel.find({ revoked: false }).populate('userId');

            for (const record of tokenRecords) {
                const isMatch = await bcrypt.compare(refreshToken, record.tokenHash);
                if (isMatch) {
                    // populated user document is in record.userId
                    return record.userId;
                }
            }

            return null;
        }
}