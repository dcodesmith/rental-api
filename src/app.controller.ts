import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthType } from './iam/authentication/enums/auth-type-enum';
import { Auth } from './iam/authentication/decorators/auth.decorator';

@Auth(AuthType.None)
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello() {
    return this.appService.getHello();
  }
}
