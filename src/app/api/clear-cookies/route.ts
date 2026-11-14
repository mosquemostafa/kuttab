import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  const response = NextResponse.json({
    cleared: allCookies.map((c) => c.name),
  });

  for (const cookie of allCookies) {
    // Delete with every path/domain combo that might have set it
    const base = {
      name: cookie.name,
      value: "",
      expires: new Date(0),
      maxAge: 0,
    };

    response.cookies.set({ ...base, path: "/" });
    response.cookies.set({ ...base, path: "/", httpOnly: true });
    response.cookies.set({ ...base, path: "/", secure: true, httpOnly: true });
    response.cookies.set({
      ...base,
      path: "/",
      sameSite: "lax",
      httpOnly: true,
    });
    response.cookies.set({
      ...base,
      path: "/",
      sameSite: "strict",
      httpOnly: true,
    });
    response.cookies.set({
      ...base,
      path: "/",
      sameSite: "none",
      secure: true,
      httpOnly: true,
    });
  }

  return response;
}
