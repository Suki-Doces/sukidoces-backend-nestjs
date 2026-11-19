import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  LoginUseCase,
  LogoutUseCase,
  RefreshTokenUseCase,
  RegisterUserUseCase,
  VerifyEmailUseCase,
} from '@application/use-cases/auth';

import {
  CancelOrderUseCase,
  ChangePasswordUseCase,
  GetUserProfileUseCase,
  ListUserOrdersUseCase,
  UpdateUserProfileUseCase,
} from '@application/use-cases/users';

import { UserRole } from '@domain/enums';
import { TokenClaims } from '@application/ports';
import { CurrentUser } from '@presentation/http/decorators';
import {
  LoginDto,
  LogoutDto,
  RefreshTokenDto,
  RegisterDto,
  ChangePasswordDto,
  UpdateProfileDto,
} from '@presentation/http/dto';

import { JwtAuthGuard } from '@presentation/http/guards';
import {
  successResponse,
  multerOptions,
  presentOrder,
  presentSession,
  presentUserProfile,
} from '@presentation/http/support';

@ApiTags('user')
@Controller('usuario')
export class UserController {
  constructor(
    private readonly registerUser: RegisterUserUseCase,
    private readonly login: LoginUseCase,
    private readonly refreshToken: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly verifyEmail: VerifyEmailUseCase,
    private readonly getProfile: GetUserProfileUseCase,
    private readonly updateProfile: UpdateUserProfileUseCase,
    private readonly changePassword: ChangePasswordUseCase,
    private readonly listOrders: ListUserOrdersUseCase,
    private readonly cancelOrder: CancelOrderUseCase,
  ) {}

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('registro')
  @HttpCode(201)
  @ApiOperation({ summary: 'Creates a customer account' })
  async register(@Body() dto: RegisterDto) {
    return successResponse(
      'User created successfully',
      presentSession(await this.registerUser.execute(dto)),
    );
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Unified login (customer or admin)' })
  async signIn(@Body() dto: LoginDto) {
    const result = await this.login.execute(dto);
    const message =
      result.user.role === UserRole.ADMIN ? 'Admin login successful' : 'Login successful';
    return successResponse(message, presentSession(result));
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Exchanges a valid refresh token for a new access + refresh pair' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return successResponse(
      'Token refreshed successfully',
      await this.refreshToken.execute(dto.refreshToken),
    );
  }

  @Get('verificar-email')
  @ApiOperation({ summary: 'Confirms the e-mail address from the link token' })
  async confirmEmail(@Query('token') token: string) {
    await this.verifyEmail.execute(token);
    return successResponse('Email verified successfully');
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async logout(@Body() dto: LogoutDto, @CurrentUser() user: TokenClaims) {
    await this.logoutUseCase.execute(dto.refreshToken, user);
    return { success: true, message: 'Logout successful' };
  }

  @Get('perfil')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async profile(@CurrentUser('id') userId: number) {
    return successResponse('Profile loaded successfully', {
      user: presentUserProfile(await this.getProfile.execute(userId)),
    });
  }

  @Put('perfil')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('foto_perfil', multerOptions))
  async editProfile(
    @CurrentUser('id') userId: number,
    @Body() dto: UpdateProfileDto,
    @UploadedFile() photo?: Express.Multer.File,
  ) {
    const updated = await this.updateProfile.execute({ userId, ...dto, photo: photo?.buffer });
    return successResponse('Data updated successfully', {
      user: updated ? presentUserProfile(updated) : null,
    });
  }

  @Put('senha')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async editPassword(@CurrentUser('id') userId: number, @Body() dto: ChangePasswordDto) {
    await this.changePassword.execute({ userId, ...dto });
    return successResponse('Password changed successfully');
  }

  @Get('pedidos')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async orders(@CurrentUser('id') userId: number) {
    return successResponse(
      'Orders loaded successfully',
      (await this.listOrders.execute(userId)).map(presentOrder),
    );
  }

  @Patch('pedidos/:id/cancelar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancels an order within the 2-hour window' })
  async cancel(@CurrentUser('id') userId: number, @Param('id', ParseIntPipe) orderId: number) {
    const order = await this.cancelOrder.execute(userId, orderId);
    return successResponse('Order cancelled successfully', {
      pedido: order ? presentOrder(order) : null,
    });
  }
}
