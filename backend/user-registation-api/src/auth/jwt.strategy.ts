import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TokenService } from 'src/token/token.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly tokenService: TokenService,
        private readonly usersService: UsersService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET || 'nosecretkeyfounded',
        });
    }

    async validate(payload: any) {  
        // Check if user exists
        const user = await this.usersService.findByEmail(payload.email);
        if (!user) {
            throw new UnauthorizedException('Invalid token: user does not exist');
        }
        return { userId: user._id, email: user.email };
    }
}