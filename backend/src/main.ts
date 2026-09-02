import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Enable CORS for the frontend origin
  app.enableCors({
    origin: [
      configService.get<string>('FRONTEND_URL') || 'http://localhost:3000',
      'https://samvad.qixolabs.com',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const port = configService.get<number>('PORT') || 4000;
  await app.listen(port);
  console.log(`Backend is running on: http://localhost:${port}`);
}
bootstrap().catch((err) => {
  console.error('Error starting server', err);
});
