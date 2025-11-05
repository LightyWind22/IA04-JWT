import { Injectable, ConflictException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  // Find user by email
  async findByEmail(email: string) {
    const user = await this.userModel.findOne({email});
    return user;
  }

  // Create new user
  async createUser(email: string, hashedPassword: string) {
    const user = new this.userModel({
      email,
      password: hashedPassword,
    });

    const savedUser = await user.save();

    // Return user without password
    return {
      id: savedUser._id.toString(),
      email: savedUser.email,
    };
  }
}