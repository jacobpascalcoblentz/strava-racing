import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SignJWT } from "jose";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      new URL("/auth/signin?error=OAuthError", request.url)
    );
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.STRAVA_CLIENT_ID!,
        client_secret: process.env.STRAVA_CLIENT_SECRET!,
        code,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Strava token error:", tokens);
      return NextResponse.redirect(
        new URL("/auth/signin?error=TokenError", request.url)
      );
    }

    const { access_token, refresh_token, expires_at, athlete } = tokens;

    // Upsert user in database
    const user = await prisma.user.upsert({
      where: { stravaId: athlete.id },
      update: {
        name: `${athlete.firstname} ${athlete.lastname}`,
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpiry: new Date(expires_at * 1000),
      },
      create: {
        stravaId: athlete.id,
        name: `${athlete.firstname} ${athlete.lastname}`,
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpiry: new Date(expires_at * 1000),
      },
    });

    // Create a session token
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
    const sessionToken = await new SignJWT({
      id: user.id,
      stravaId: user.stravaId,
      name: user.name,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("30d")
      .sign(secret);

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (error) {
    console.error("Strava auth error:", error);
    return NextResponse.redirect(
      new URL("/auth/signin?error=ServerError", request.url)
    );
  }
}
