import { Injectable } from "@nestjs/common";
import { db } from "./db.js";

@Injectable()
export class PrismaService {
  public readonly db = db;
}
