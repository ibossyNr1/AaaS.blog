"use client";

import { AISearch } from "@/components/ai-search";

const EXAMPLE_QUERIES = [
  "Compare the top 3 AI coding assistants",
  "What's the best vector database for production use?",
  "Show me trending models this week",
  "Which tools integrate with LangChain?",
];

export function AskClient() {
  return <AISearch exampleQueries={EXAMPLE_QUERIES} />;
}
