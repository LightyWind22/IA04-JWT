import { Controller, Post, Body, HttpCode, HttpStatus, UsePipes, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('user')
export class UsersController {
    // @UseGuards(AuthGuard('jwt'))
    // @Get('profile')
    // @HttpCode(HttpStatus.OK)
    // async getProfile(@Request() req) {
    //     return req.user;
    // }
}