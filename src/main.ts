import { AppModule } from './modules/app.module';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const documentBuilder = new DocumentBuilder()
    .setTitle('Swagger API')
    .setDescription('백엔드 API 문서')
    .setVersion('1.0')
    .addBearerAuth();

  if (process.env.SWAGGER_SERVER_URL) {
    documentBuilder.addServer(process.env.SWAGGER_SERVER_URL, '개발 서버');
  }
  if (process.env.SWAGGER_SERVER_URL_NGROK) {
    documentBuilder.addServer(
      process.env.SWAGGER_SERVER_URL_NGROK,
      '개발 서버 (ngrok)',
    );
  }

  const config = documentBuilder.build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
