import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BcryptJsAdapter } from '../common';
import { envs, NATS_SERVICE } from '../config';
import { LoginUserDto, RegisterUserDto } from './dto';
import { JwtPayload } from './interfaces';
import { User } from './schemas';

@Injectable()
export class AuthService {
  private readonly logger: Logger = new Logger(AuthService.name);

  constructor(
    @Inject(NATS_SERVICE) private readonly natsClient: ClientProxy,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly bcryptJsAdapter: BcryptJsAdapter,
    private readonly jwtService: JwtService,
  ) {}

  public async registerUser(
    registerUserDto: RegisterUserDto,
  ): Promise<unknown> {
    const { name, password, email } = registerUserDto;

    try {
      const userFound = await this.userModel.findOne({ email });

      if (userFound) {
        throw new Error('User already exists');
      }

      const newUser = await this.userModel.create({
        email,
        name,
        password: this.bcryptJsAdapter.hash(password),
      });

      const { name: userName, email: userEmail, id: userId } = newUser;

      return {
        user: {
          name: userName,
          email: userEmail,
          id: userId,
        },
        token: await this.singJwt({
          id: userId,
          name: userName,
          email: userEmail,
        }),
      };
    } catch (error) {
      const finalError = error as Error;
      throw new RpcException({
        status: 400,
        message: finalError.message,
      });
    }
  }

  public async loginUser(loginUserDto: LoginUserDto) {
    const { password, email } = loginUserDto;

    try {
      const userFound = await this.userModel.findOne({ email });

      if (!userFound) throw new Error('Invalid credentials');

      const isPasswordValid: boolean = this.bcryptJsAdapter.check(
        password,
        userFound.password,
      );

      if (!isPasswordValid) throw new Error('Invalid credentials');

      const { name: userName, email: userEmail, id: userId } = userFound;

      return {
        user: {
          name: userName,
          email: userEmail,
          id: userId,
        },
        token: await this.singJwt({
          id: userId,
          name: userName,
          email: userEmail,
        }),
      };
    } catch (error) {
      const finalError = error as Error;
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: finalError.message,
      });
    }
  }

  public async verifyToken(token: string) {
    try {
      const {sub, iat, exp, ...user} = this.jwtService.verify(token, {
        secret: envs.jwtSecret,
      });

      return {
        user,
        token: await this.singJwt(user),
      };
    } catch (error) {
      console.error(error);
      throw new RpcException({
        status: HttpStatus.UNAUTHORIZED,
        message: 'Token not valid',
      });
    }
  }

  public async singJwt(payload: JwtPayload) {
    return this.jwtService.sign(payload);
  }
}
