import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ConfigService } from "@nestjs/config";
import { Logger, RequestMethod, ValidationPipe } from "@nestjs/common";
import helmet from "helmet";
import { GlobalExceptionsFilter } from "./common/filters";
import { connectSwagger } from "./config/swagger";
import {
  httpMetricsMiddleware,
  initPrometheus,
} from "@kinvue/http-metrics";

async function bootstrap() {
  initPrometheus("gateway");
  const app = await NestFactory.create(AppModule);
  app.use(httpMetricsMiddleware("gateway"));
  //add config module
  const configService = app.get(ConfigService);
  const logger = new Logger("main");

  //add global prefix
  logger.log("Set global prefix: api");
  app.setGlobalPrefix("api", {
    exclude: [
      { path: "health", method: RequestMethod.ALL },
      { path: "health/(.*)", method: RequestMethod.ALL },
      { path: "metrics", method: RequestMethod.GET },
      { path: ".well-known", method: RequestMethod.ALL },
      { path: ".well-known/(.*)", method: RequestMethod.ALL },
    ],
  });

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
  logger.log(`@kinvue/gateway listening on ${port}`);
}
bootstrap();
