import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SignJWT } from "jose";
import { encrypt } from "@/lib/crypto";
import { checkRateLimit, getRateLimitKey, rateLimitResponse, authRateLimitConfig } from "@/lib/rate-limit";

export async function GET(request: Request) {
  // Rate limit auth attempts
  const rateLimitKey = getRateLimitKey(request);
  const rateLimit = checkRateLimit(rateLimitKey, authRateLimitConfig);
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetTime);
  }
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Validate state parameter to prevent CSRF
  const cookieStore = await cookies();
  const storedState = cookieStore.get("oauth_state")?.value;

  // Delete the state cookie regardless of outcome
  cookieStore.delete("oauth_state");

  if (!storedState || storedState !== state) {
    console.error("OAuth state mismatch - possible CSRF attempt");
    return NextResponse.redirect(
      new URL("/auth/signin?error=StateMismatch", request.url)
    );
  }

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
      console.error("Strava token error");
      return NextResponse.redirect(
        new URL("/auth/signin?error=TokenError", request.url)
      );
    }

    const { access_token, refresh_token, expires_at, athlete } = tokens;

    // Encrypt tokens before storing
    const encryptedAccessToken = encrypt(access_token);
    const encryptedRefreshToken = encrypt(refresh_token);

    // Upsert user in database
    const user = await prisma.user.upsert({
      where: { stravaId: athlete.id },
      update: {
        name: `${athlete.firstname} ${athlete.lastname}`,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiry: new Date(expires_at * 1000),
      },
      create: {
        stravaId: athlete.id,
        name: `${athlete.firstname} ${athlete.lastname}`,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiry: new Date(expires_at * 1000),
      },
    });

    // Create a session token (7 days expiration for better security)
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
    const sessionToken = await new SignJWT({
      id: user.id,
      stravaId: user.stravaId,
      name: user.name,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(secret);

    // Set session cookie
    cookieStore.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (error) {
    console.error("Strava auth error");
    return NextResponse.redirect(
      new URL("/auth/signin?error=ServerError", request.url)
    );
  }
}
