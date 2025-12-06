import { NextResponse } from "next/server";
import { mockUsers } from "@/app/lib/mockUsers";

export async function POST(req: Request) {
  const { username, password } = await req.json();

  const user = mockUsers.find(
    (u) => u.username === username && u.password === password
  );

  if (!user)
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  // set cookies
  const res = NextResponse.json({ success: true, role: user.role });

  res.cookies.set("role", user.role, {
    httpOnly: true,
    secure: false,
    path: "/",
  });

  res.cookies.set("logged", "true", {
    httpOnly: true,
    secure: false,
    path: "/",
  });

  return res;
}
