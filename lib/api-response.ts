import { NextResponse } from "next/server";

export function apiSuccess<T>(data: T, meta?: Record<string, unknown>, status = 200) {
  return NextResponse.json({ data, error: null, ...(meta ? { meta } : {}) }, { status });
}

export function apiError(code: string, message: string, status: number) {
  return NextResponse.json({ data: null, error: { code, message } }, { status });
}
