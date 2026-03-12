/**
 * Health check utilities for monitoring.
 */

import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from './firebase';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  timestamp: string;
  checks: {
    firestore: { status: string; latencyMs: number };
    memory: { heapUsedMB: number; heapTotalMB: number; rssMP: number };
    environment: { nodeVersion: string; nextVersion: string };
  };
}

const startTime = Date.now();

export async function getHealthStatus(): Promise<HealthStatus> {
  let firestoreStatus = 'ok';
  let firestoreLatency = 0;

  try {
    const start = Date.now();
    const q = query(collection(db, 'tools'), limit(1));
    await getDocs(q);
    firestoreLatency = Date.now() - start;
  } catch {
    firestoreStatus = 'error';
  }

  const mem = typeof process !== 'undefined' && process.memoryUsage
    ? process.memoryUsage()
    : { heapUsed: 0, heapTotal: 0, rss: 0 };

  const overallStatus =
    firestoreStatus === 'error'
      ? 'unhealthy'
      : firestoreLatency > 5000
        ? 'degraded'
        : 'healthy';

  return {
    status: overallStatus,
    version: process.env.npm_package_version ?? '1.0.0',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
    checks: {
      firestore: { status: firestoreStatus, latencyMs: firestoreLatency },
      memory: {
        heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
        rssMP: Math.round(mem.rss / 1024 / 1024),
      },
      environment: {
        nodeVersion: typeof process !== 'undefined' ? process.version : 'unknown',
        nextVersion: '14.x',
      },
    },
  };
}
