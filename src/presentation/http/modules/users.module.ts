import { Module } from '@nestjs/common';
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

import { UserController } from '@presentation/http/controllers';

@Module({
  controllers: [UserController],
  providers: [
    RegisterUserUseCase,
    LoginUseCase,
    LogoutUseCase,
    RefreshTokenUseCase,
    VerifyEmailUseCase,
    GetUserProfileUseCase,
    UpdateUserProfileUseCase,
    ChangePasswordUseCase,
    ListUserOrdersUseCase,
    CancelOrderUseCase,
  ],
})
export class UsersModule {}
