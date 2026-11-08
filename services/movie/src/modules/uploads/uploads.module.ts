import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module";
import { AdminScopeGuard } from "../../common/guards/admin-scope.guard";
import { AdminMovieUploadController } from "./admin-movie-upload.controller";
import { MediaTranscodePublisher } from "./media-transcode.publisher";
import { MovieUploadService } from "./movie-upload.service";
import { S3MultipartService } from "./s3-multipart.service";
import { UploadsRepository } from "./uploads.repository";

@Module({
  imports: [DatabaseModule],
  controllers: [AdminMovieUploadController],
  providers: [
    AdminScopeGuard,
    UploadsRepository,
    S3MultipartService,
    MediaTranscodePublisher,
    MovieUploadService,
  ],
})
export class UploadsModule {}
