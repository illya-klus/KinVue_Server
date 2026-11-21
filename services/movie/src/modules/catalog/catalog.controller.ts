import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
  ValidationPipe,
} from "@nestjs/common";
import { AdminScopeGuard } from "../../common/guards/admin-scope.guard";
import { MoviesRepository } from "../../database/movies.repository";
import { NotFoundException } from "@nestjs/common";
import { CatalogService } from "./catalog.service";
import { CreateMovieDto, ScheduleMovieDto, UpdateMovieDto } from "./movie.dto";
import { callerId } from "./caller-id";
const strictBody = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
});

@Controller("admin/movies")
@UseGuards(AdminScopeGuard)
export class AdminCatalogController {
  constructor(private readonly catalog: CatalogService) {}
  @Post()
  create(
    @Body(strictBody) body: CreateMovieDto,
    @Headers("x-user-id") userId?: string,
  ) {
    return this.catalog.create(body, callerId(userId));
  }
  @Get(":movieId")
  get(@Param("movieId", ParseUUIDPipe) id: string) {
    return this.catalog.adminGet(id);
  }
  @Patch(":movieId")
  update(
    @Param("movieId", ParseUUIDPipe) id: string,
    @Body(strictBody) body: UpdateMovieDto,
  ) {
    return this.catalog.update(id, body);
  }
  @Post(":movieId/publish")
  @HttpCode(200)
  publish(@Param("movieId", ParseUUIDPipe) id: string) {
    return this.catalog.publish(id);
  }
  @Post(":movieId/schedule")
  @HttpCode(200)
  schedule(
    @Param("movieId", ParseUUIDPipe) id: string,
    @Body(strictBody) body: ScheduleMovieDto,
  ) {
    return this.catalog.schedule(id, body.publishAt);
  }
}
@Controller()
export class PublicCatalogController {
  constructor(
    private readonly catalog: CatalogService,
    private readonly movies: MoviesRepository,
  ) {}
  @Get("movies/:movieId")
  get(@Param("movieId", ParseUUIDPipe) id: string) {
    return this.catalog.publicGet(id);
  }
  @Post("movies/:movieId/watchlist")
  @HttpCode(200)
  async add(
    @Param("movieId", ParseUUIDPipe) id: string,
    @Headers("x-user-id") userId?: string,
  ) {
    if (!(await this.movies.addToWatchlist(callerId(userId), id)))
      throw new NotFoundException("Movie not found");
    return { ok: true };
  }
  @Delete("movies/:movieId/watchlist")
  @HttpCode(204)
  async remove(
    @Param("movieId", ParseUUIDPipe) id: string,
    @Headers("x-user-id") userId?: string,
  ) {
    await this.movies.removeFromWatchlist(callerId(userId), id);
  }
  @Get("watchlist")
  list(@Headers("x-user-id") userId?: string) {
    return this.movies.listWatchlist(callerId(userId));
  }
}
