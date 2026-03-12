export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { generateTypeScriptSDK } from "@/lib/sdk-generator";

export async function GET() {
  const sdk = generateTypeScriptSDK();

  return new NextResponse(sdk, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": 'attachment; filename="aaas-sdk.ts"',
      "Cache-Control": "no-store",
    },
  });
}
