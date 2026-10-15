import { NextRequest, NextResponse } from 'next/server';
import { getBenefit } from '@/lib/server/benefit';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const b = await getBenefit(params.id);
  if (!b) return NextResponse.json({ error: '혜택을 찾을 수 없어요' }, { status: 404 });
  return NextResponse.json(b);
}
