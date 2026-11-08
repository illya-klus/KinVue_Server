import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from "@nestjs/common";
import { AdminScopeGuard } from "../../common/guards/admin-scope.guard";
import { UploadCompleteDto } from "./dto/upload-complete.dto";
import { UploadInitDto } from "./dto/upload-init.dto";
import { MovieUploadService } from "./movie-upload.service";

@Controller("admin/movies")
@UseGuards(AdminScopeGuard)
export class AdminMovieUploadController {
  constructor(private readonly uploads: MovieUploadService) {}

  @Post(":movieId/upload/init")
  public initUpload(
    @Param("movieId", ParseUUIDPipe) movieId: string,
    @Body() body: UploadInitDto,
  ) {
    return this.uploads.initUpload(movieId, body);
  }

  @Post(":movieId/upload/complete")
  public completeUpload(
    @Param("movieId", ParseUUIDPipe) movieId: string,
    @Body() body: UploadCompleteDto,
  ) {
    return this.uploads.completeUpload(movieId, body);
  }
}
