import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import { prisma } from "./prisma";

// Custom Strava provider for NextAuth v5
const StravaProvider = {
  id: "strava",
  name: "Strava",
  type: "oauth" as const,
  authorization: {
    url: "https://www.strava.com/oauth/authorize",
    params: {
      scope: "read,activity:read_all",
      response_type: "code",
    },
  },
  token: {
    url: "https://www.strava.com/oauth/token",
    async request({ params, provider }: { params: { code: string }; provider: { clientId: string; clientSecret: string } }) {
      const response = await fetch("https://www.strava.com/oauth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: provider.clientId,
          client_secret: provider.clientSecret,
          code: params.code,
          grant_type: "authorization_code",
        }),
      });

      const tokens = await response.json();

      if (!response.ok) {
        throw new Error(tokens.message || "Failed to get tokens");
      }

      return {
        tokens: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: tokens.expires_at,
          token_type: tokens.token_type,
          athlete: tokens.athlete,
        },
      };
    },
  },
  userinfo: {
    url: "https://www.strava.com/api/v3/athlete",
    async request({ tokens }: { tokens: { access_token: string; athlete?: { id: number; firstname: string; lastname: string; profile: string } } }) {
      // Strava returns athlete info in the token response
      if (tokens.athlete) {
        return tokens.athlete;
      }
      // Fallback to API call
      const response = await fetch("https://www.strava.com/api/v3/athlete", {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });
      return response.json();
    },
  },
  profile(profile: {
    id: number;
    firstname: string;
    lastname: string;
    profile: string;
  }) {
    return {
      id: profile.id.toString(),
      name: `${profile.firstname} ${profile.lastname}`,
      image: profile.profile,
    };
  },
  clientId: process.env.STRAVA_CLIENT_ID!,
  clientSecret: process.env.STRAVA_CLIENT_SECRET!,
};

export const authConfig: NextAuthConfig = {
  providers: [StravaProvider],
  callbacks: {
    async signIn({ user, account }) {
      if (!account || !user.id) return false;

      const stravaId = parseInt(user.id);
      const tokenExpiry = new Date(
        (account.expires_at as number) * 1000
      );

      // Upsert user with tokens
      await prisma.user.upsert({
        where: { stravaId },
        update: {
          name: user.name || "Unknown",
          accessToken: account.access_token as string,
          refreshToken: account.refresh_token as string,
          tokenExpiry,
        },
        create: {
          stravaId,
          name: user.name || "Unknown",
          accessToken: account.access_token as string,
          refreshToken: account.refresh_token as string,
          tokenExpiry,
        },
      });

      return true;
    },
    async jwt({ token, account, user }) {
      if (account && user) {
        token.stravaId = parseInt(user.id as string);
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.stravaId) {
        const dbUser = await prisma.user.findUnique({
          where: { stravaId: token.stravaId as number },
        });
        if (dbUser) {
          (session.user as { id?: string }).id = dbUser.id;
          (session as { accessToken?: string }).accessToken = dbUser.accessToken;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
