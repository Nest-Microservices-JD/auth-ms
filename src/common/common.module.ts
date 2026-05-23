import { Module } from '@nestjs/common';
import { BcryptJsAdapter } from './adapters';

@Module({
  imports: [],
  providers: [BcryptJsAdapter],
  exports: [],
  controllers: [BcryptJsAdapter],
})
export class CommonModule {}
