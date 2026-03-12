export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function GET() {
  try {
    const q = query(collection(db, 'tools'), limit(1));
    await getDocs(q);
    return NextResponse.json({ ready: true }, { status: 200 });
  } catch {
    return NextResponse.json({ ready: false }, { status: 503 });
  }
}
