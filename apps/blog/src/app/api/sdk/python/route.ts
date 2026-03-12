export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { generatePythonSDK } from "@/lib/sdk-generator";

export async function GET() {
  const sdk = generatePythonSDK();

  return new NextResponse(sdk, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": 'attachment; filename="aaas_sdk.py"',
      "Cache-Control": "no-store",
    },
  });
}
