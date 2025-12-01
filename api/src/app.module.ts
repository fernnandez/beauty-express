import { ApplicationModule } from '@application/application.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig()),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'client'),
      exclude: ['/api*'], // Não servir arquivos estáticos para rotas da API
    }),
    ApplicationModule,
  ],
})
export class AppModule {}
