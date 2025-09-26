import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CustomRequest = createParamDecorator(
  (data: void, ctx: ExecutionContext) => {
    return ctx.switchToHttp().getRequest();
  },
);
