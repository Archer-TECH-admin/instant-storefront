import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return new NextResponse("Missing id", { status: 400 });
  const url = "http://localhost:8080/site/hmdb/master/_/image/" + id + ":scale-width(1400)/hero";
  const res = await fetch(url);
  const blob = await res.blob();
  return new NextResponse(blob, {
    headers: { "Content-Type": res.headers.get("Content-Type") || "image/jpeg" },
  });
}
