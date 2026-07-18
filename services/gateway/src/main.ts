import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ConfigService } from "@nestjs/config";
import { Logger, ValidationPipe } from "@nestjs/common";
import helmet from "helmet";
import { GlobalExceptionsFilter } from "./common/filters";
import { connectSwagger } from "./config/swagger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  //add config module
  const configService = app.get(ConfigService);
  const logger = new Logger("main");

  //add global prefix
  logger.log("Set global prefix: api");
  app.setGlobalPrefix("api");

  //add validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, //delete param which is not in DTO
      forbidNonWhitelisted: true, //throw an error when param isn't in DTO
      transform: true, //automatic data types
    }),
  );

  //CORS
  const origins = configService
    .getOrThrow<string>("ORIGINS")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: [origins],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    allowedHeaders: "Content-Type, Authorization",
  });

  //Helmet
  app.use(helmet());

  //Global exception filter
  app.useGlobalFilters(new GlobalExceptionsFilter());

  //Swagger
  connectSwagger(app);

  const port = configService.getOrThrow<number>("PORT");
  await app.listen(port);
  logger.log("Server started on port: " + port);
}
bootstrap();
