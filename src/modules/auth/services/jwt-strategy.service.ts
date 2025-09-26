import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { SupabaseService } from '../../supabase/supabase.service';

type JwtPayload = {
  sub: string;
  email: string;
  iss: string;
  iat?: number;
  exp?: number;
  [key: string]: any;
};

@Injectable()
export class JwtStrategyService extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
  ) {
    const secretKey = configService.get('SUPABASE_JWT_SECRET');
    if (!secretKey) {
      throw new Error('Auth Params must be defined');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secretKey,
      algorithms: ['HS256'],
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    const response = await this.supabaseService.supabase.auth.getUser(
      token ?? undefined,
    );
    const user = response.data.user;

    if (!user) {
      throw new ForbiddenException(
        `User not found. Payload: ${payload.email} ${payload.sub}`,
      );
    }

    if (user.is_anonymous) {
      throw new ForbiddenException('Anonymous users are not allowed');
    }

    return { ...user };
  }
}
