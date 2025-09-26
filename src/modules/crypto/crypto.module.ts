import { Module } from '@nestjs/common';
import { CryptoService } from './crypto.service';

@Module({
  imports: [],
  providers: [CryptoService],
  exports: [CryptoService],
  controllers: [],
})
export class CryptoModule {}
