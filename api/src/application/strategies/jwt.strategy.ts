import { jwtConfig } from '@config/jwt.config';
import { AccessTokenPayload } from '@domain/services/auth.types';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConfig.accessSecret,
    });
  }

  validate(payload: AccessTokenPayload): AccessTokenPayload {
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Token inválido');
    }

    return payload;
  }
}
