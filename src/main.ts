import { AppModule } from './modules/app.module';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  const documentBuilder = new DocumentBuilder()
    .setTitle('Swagger API')
    .setDescription('백엔드 API 문서')
    .setVersion('1.0')
    .addBearerAuth();

  // 로컬 개발 환경(.env에 SWAGGER_LOCAL=true)에서는 Swagger UI의 기본 서버가
  // 배포 서버 주소가 아니라 로컬 주소를 가리키도록, 로컬 서버를 목록 맨 앞에 추가한다.
  // (addServer로 추가한 순서 = Swagger UI Servers 드롭다운 기본 선택 순서)
  if (process.env.SWAGGER_LOCAL === 'true') {
    documentBuilder.addServer(
      `http://localhost:${process.env.PORT ?? 3000}`,
      '로컬 개발 서버',
    );
  }

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
