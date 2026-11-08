import type { NextFunction, Request, Response } from "express";
import {
  Counter,
  Gauge,
  Histogram,
  collectDefaultMetrics,
  register,
} from "prom-client";

const counters = new Map<string, Counter<string>>();
const histograms = new Map<string, Histogram<string>>();
const gauges = new Map<string, Gauge<string>>();

let defaultMetricsStarted = false;

export function initPrometheus(serviceName: string): void {
  if (!defaultMetricsStarted) {
    collectDefaultMetrics({ register, labels: { service: serviceName } });
    defaultMetricsStarted = true;
  }
}

export function getCounter(
  name: string,
  help: string,
  labelNames: readonly string[] = [],
): Counter<string> {
  const existing = counters.get(name);
  if (existing) {
    return existing;
  }
  const created = new Counter({
    name,
    help,
    labelNames,
    registers: [register],
  });
  counters.set(name, created);
  return created;
}

export function getHistogram(
  name: string,
  help: string,
  labelNames: readonly string[] = [],
  buckets: number[] = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
): Histogram<string> {
  const existing = histograms.get(name);
  if (existing) {
    return existing;
  }
  const created = new Histogram({
    name,
    help,
    labelNames,
    buckets,
    registers: [register],
  });
  histograms.set(name, created);
  return created;
}

export function getGauge(
  name: string,
  help: string,
  labelNames: readonly string[] = [],
): Gauge<string> {
  const existing = gauges.get(name);
  if (existing) {
    return existing;
  }
  const created = new Gauge({ name, help, labelNames, registers: [register] });
  gauges.set(name, created);
  return created;
}

export function httpMetricsMiddleware(
  serviceName: string,
): (req: Request, res: Response, next: NextFunction) => void {
  const requests = getCounter("http_requests_total", "Total HTTP requests", [
    "service",
    "method",
    "status_code",
  ]);
  const duration = getHistogram(
    "http_request_duration_seconds",
    "HTTP request latency",
    ["service", "method", "status_code"],
  );

  return (req: Request, res: Response, next: NextFunction) => {
    const path = req.path ?? "";
    if (path.startsWith("/metrics") || path.startsWith("/health")) {
      next();
      return;
    }
    const start = process.hrtime.bigint();
    res.on("finish", () => {
      const labels = {
        service: serviceName,
        method: req.method,
        status_code: String(res.statusCode),
      };
      requests.inc(labels);
      duration.observe(labels, Number(process.hrtime.bigint() - start) / 1e9);
    });
    next();
  };
}

export async function renderPrometheus(): Promise<string> {
  return register.metrics();
}

export const prometheusContentType = register.contentType;
