import { Controller, Get, Query } from "@nestjs/common";
import { MoviesSearchService } from "./movies-search.service";
import { SearchQueryDto } from "./search-query.dto";

@Controller("movies")
export class MoviesSearchController {
  constructor(private readonly search: MoviesSearchService) {}

  @Get("search")
  public searchMovies(@Query() query: SearchQueryDto) {
    return this.search.search(query);
  }
}
