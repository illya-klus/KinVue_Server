import { type INestApplication } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";

export const connectSwagger = (app: INestApplication) => {
  const config = new DocumentBuilder()
    .setTitle("KinVue API")
    .setDescription("KinVue API description")
    .setVersion("1.0")
    .addTag("KinVue")
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, documentFactory);
};
