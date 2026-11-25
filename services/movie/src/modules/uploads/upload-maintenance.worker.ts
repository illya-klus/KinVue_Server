import { Injectable, Logger } from "@nestjs/common";
import { Interval } from "@nestjs/schedule";
import { UploadsRepository } from "./uploads.repository";
import { S3MultipartService } from "./s3-multipart.service";
import { MediaTranscodePublisher } from "./media-transcode.publisher";

@Injectable()
export class UploadMaintenanceWorker {
  private busy = false;
  private readonly logger = new Logger(UploadMaintenanceWorker.name);
  constructor(
    private readonly uploads: UploadsRepository,
    private readonly s3: S3MultipartService,
    private readonly publisher: MediaTranscodePublisher,
  ) {}

  @Interval(30_000)
  async tick() {
    if (this.busy) return;
    this.busy = true;
    try {
      for (const event of await this.uploads.pending()) {
        try {
          await this.uploads.withMovieLock(event.payload.movieId, async () => {
            // Recheck under the same per-movie lock used by other dispatchers.
            if (
              !(await this.uploads.pending()).some(
                (e) => e.event_id === event.event_id,
              )
            )
              return;
            await this.publisher.publish(event.payload);
            await this.uploads.sent(event.event_id);
          });
        } catch {
          this.logger.warn("Transcode enqueue deferred");
        }
      }
      for (const stale of await this.uploads.stale()) {
        await this.uploads.withMovieLock(stale.movie_id, async () => {
          const current = await this.uploads.findInitiatedById(
            stale.id,
            stale.movie_id,
          );
          if (
            !current ||
            Date.now() - new Date(current.created_at).getTime() <= 86_400_000
          )
            return;
          await this.s3.abortMultipartUpload(
            current.object_key,
            current.s3_upload_id,
          );
          await this.uploads.abandon(current.id, current.movie_id);
        });
      }
      await this.s3.cleanOrphanedMultipart();
    } catch {
      this.logger.warn(
        "Upload maintenance deferred; pending work will be retried",
      );
    } finally {
      this.busy = false;
    }
  }
}
