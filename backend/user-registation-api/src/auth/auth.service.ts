import { Injectable, ConflictException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { RegisterUserDto } from './dto/register.dto';
import { LoginUserDto } from './dto/login.dto';
import { TokenService } from 'src/token/token.service';
import { log } from 'console';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly tokenService: TokenService,
    ) {}

    // Register new user
    async register(registerUserDto: RegisterUserDto): Promise<{ id: string; email: string }> {
        const {email, password} = registerUserDto;

        // Check if user already exists
        const existingUser = await this.usersService.findByEmail(email);
        if (existingUser) {
            throw new ConflictException('Email already exists');
        }

        try {
            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create new user
            const user = await this.usersService.createUser(email, hashedPassword);
            if (!user) {
                throw new BadRequestException('Failed to create user');
            }

            // Return user without password
            return user;
        } catch (error) {
            throw new BadRequestException('Error creating user');
        }
    }

    // Login user
    async login(loginUserDto: LoginUserDto): Promise<{id: string, email: string, accessToken: string, refreshToken: string}> {
        const { email, password } = loginUserDto;
        
            // Find user by email
            const user = await this.usersService.findByEmail(email);
            if (!user) {
                throw new UnauthorizedException('Invalid credentials');
            }
        
            // Verify password
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                throw new UnauthorizedException('Invalid credentials');
            }
        
            // Generate JWT payload
            const payload = { email: user.email, sub: user._id.toString() };

            // Generate access and refresh tokens
            const { accessToken, newRefreshToken } = await this.tokenService.generateTokens(user);
            console.log('Generated Tokens:', { accessToken, newRefreshToken });

            // Return user data with tokens
            return {
                id: user._id.toString(),
                email: user.email,
                accessToken: accessToken,
                refreshToken: newRefreshToken,
            };
    }

    //Refresh tokens
    async refreshTokens(userEmail: string, refreshToken: string): Promise<{ accessToken: string, newRefreshToken: string }> {
        // Find user by ID
        const user = await this.usersService.findByEmail(userEmail);
        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        // Validate refresh token
        const isValid = await this.tokenService.validateRefreshToken(user, refreshToken);
        if (!isValid) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        // Rotation: Revoke old refresh token
        await this.tokenService.revokeRefreshToken(user);

        // Rotation: Generate and store new refresh token
        const { accessToken, newRefreshToken} = await this.tokenService.generateTokens(user);
        console.log('Refreshed Tokens:', { accessToken, newRefreshToken });

        return { accessToken, newRefreshToken };
    }

        // Refresh tokens by raw refresh token (e.g., read from httpOnly cookie)
        async refreshUsingRawToken(refreshToken: string): Promise<{ accessToken: string, newRefreshToken: string, userEmail: string }> {
            // Find user by refresh token
            const userObj: any = await this.tokenService.findUserByRefreshToken(refreshToken);
            if (!userObj) {
                throw new UnauthorizedException('Invalid refresh token');
            }

            // userObj should be populated user document
            const userEmail = userObj.email;

            // Proceed to refresh tokens using existing logic
            const { accessToken, newRefreshToken } = await this.refreshTokens(userEmail, refreshToken);
            return { accessToken, newRefreshToken, userEmail };
        }

        // Revoke refresh tokens associated with a raw refresh token (used on logout)
        async revokeByRawToken(refreshToken: string): Promise<void> {
            const userObj: any = await this.tokenService.findUserByRefreshToken(refreshToken);
            if (!userObj) return;
            await this.tokenService.revokeRefreshToken(userObj);
        }
}