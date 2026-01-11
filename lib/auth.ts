import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import { prisma } from "./prisma";

// Custom Strava provider
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
  token: "https://www.strava.com/oauth/token",
  userinfo: "https://www.strava.com/api/v3/athlete",
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
  clientId: process.env.STRAVA_CLIENT_ID,
  clientSecret: process.env.STRAVA_CLIENT_SECRET,
};

export const authConfig: NextAuthConfig = {
  providers: [StravaProvider],
  callbacks: {
    async signIn({ user, account }) {
      if (!account || !user.id) return false;

      const stravaId = parseInt(user.id);
      const tokenExpiry = new Date(
        Date.now() + (account.expires_in as number) * 1000
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
          session.user.id = dbUser.id;
          (session as { accessToken?: string }).accessToken =
            dbUser.accessToken;
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
