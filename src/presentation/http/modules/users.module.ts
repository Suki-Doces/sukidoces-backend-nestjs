import { Module } from '@nestjs/common';
import { LoginUseCase } from '../../../application/use-cases/auth/login.use-case';
import { LogoutUseCase } from '../../../application/use-cases/auth/logout.use-case';
import { RefreshTokenUseCase } from '../../../application/use-cases/auth/refresh-token.use-case';
import { RegisterUserUseCase } from '../../../application/use-cases/auth/register-user.use-case';
import { VerifyEmailUseCase } from '../../../application/use-cases/auth/verify-email.use-case';
import { CancelOrderUseCase } from '../../../application/use-cases/users/cancel-order.use-case';
import { ChangePasswordUseCase } from '../../../application/use-cases/users/change-password.use-case';
import { GetUserProfileUseCase } from '../../../application/use-cases/users/get-user-profile.use-case';
import { ListUserOrdersUseCase } from '../../../application/use-cases/users/list-user-orders.use-case';
import { UpdateUserProfileUseCase } from '../../../application/use-cases/users/update-user-profile.use-case';
import { UserController } from '../controllers/user.controller';

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
