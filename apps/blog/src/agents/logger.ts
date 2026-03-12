/**
 * Agent Logging Utility
 *
 * Logs all agent actions to the Firestore `agent_logs` collection.
 * Each log entry records the agent name, action performed, structured details,
 * timestamp, success status, and optional error message.
 */

import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Initialize firebase-admin once across all agents
if (getApps().length === 0) {
  initializeApp({ projectId: "aaas-platform" });
}

const db = getFirestore();

export interface AgentLogEntry {
  agent: string;
  action: string;
  details: Record<string, unknown>;
  timestamp: FirebaseFirestore.Timestamp;
  success: boolean;
  error?: string;
}

/**
 * Write an agent action log to Firestore.
 */
export async function logAgentAction(
  agent: string,
  action: string,
  details: Record<string, unknown>,
  success: boolean,
  error?: string,
): Promise<void> {
  const entry: Record<string, unknown> = {
    agent,
    action,
    details,
    timestamp: FieldValue.serverTimestamp(),
    success,
  };
  if (error) {
    entry.error = error;
  }

  try {
    await db.collection("agent_logs").add(entry);
  } catch (err) {
    // Fallback to console if Firestore write fails — never let logging crash an agent
    console.error(`[logger] Failed to write log for ${agent}/${action}:`, err);
  }
}

/**
 * Retrieve recent logs for a specific agent.
 */
export async function getAgentLogs(
  agent: string,
  limit = 50,
): Promise<AgentLogEntry[]> {
  const snap = await db
    .collection("agent_logs")
    .where("agent", "==", agent)
    .orderBy("timestamp", "desc")
    .limit(limit)
    .get();

  return snap.docs.map((doc) => doc.data() as AgentLogEntry);
}

/**
 * Retrieve all recent agent logs regardless of agent name.
 */
export async function getAllAgentLogs(limit = 100): Promise<AgentLogEntry[]> {
  const snap = await db
    .collection("agent_logs")
    .orderBy("timestamp", "desc")
    .limit(limit)
    .get();

  return snap.docs.map((doc) => doc.data() as AgentLogEntry);
}

export { db };
