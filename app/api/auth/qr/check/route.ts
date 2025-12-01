import { NextRequest, NextResponse } from "next/server";
import { getToken } from "../start/route"; // путь подправь под свою структуру

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ status: "error", message: "No token" }, { status: 400 });
  }

  const record = getToken(token);
  if (!record) {
    return NextResponse.json({ status: "error", message: "Not found" }, { status: 404 });
  }

  if (record.status === "pending") {
    return NextResponse.json({ status: "pending" });
  }

  // Тут можно создать сессию/JWT и отдать фронту
  return NextResponse.json({ status: "approved" });
}
