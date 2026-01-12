// Mock environment variables
process.env.STRAVA_CLIENT_ID = "test-client-id";
process.env.STRAVA_CLIENT_SECRET = "test-client-secret";

// Mock prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

// Mock next-auth
jest.mock("next-auth", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    handlers: {},
    auth: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
  })),
}));

import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Get typed mocks
const mockUpsert = prisma.user.upsert as jest.MockedFunction<typeof prisma.user.upsert>;
const mockFindUnique = prisma.user.findUnique as jest.MockedFunction<typeof prisma.user.findUnique>;

describe("lib/auth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("authConfig", () => {
    it("should have strava provider configured", () => {
      expect(authConfig.providers).toHaveLength(1);
      expect(authConfig.providers[0].id).toBe("strava");
    });

    it("should have custom sign in page configured", () => {
      expect(authConfig.pages?.signIn).toBe("/auth/signin");
    });
  });

  describe("callbacks", () => {
    describe("signIn", () => {
      it("should return false if no account", async () => {
        const result = await authConfig.callbacks!.signIn!({
          user: { id: "123", name: "Test User" },
          account: null,
          profile: undefined,
        } as never);

        expect(result).toBe(false);
        expect(mockUpsert).not.toHaveBeenCalled();
      });

      it("should return false if no user id", async () => {
        const result = await authConfig.callbacks!.signIn!({
          user: { name: "Test User" },
          account: { access_token: "token", refresh_token: "refresh", expires_at: 1234567890 },
          profile: undefined,
        } as never);

        expect(result).toBe(false);
        expect(mockUpsert).not.toHaveBeenCalled();
      });

      it("should upsert user and return true on valid sign in", async () => {
        mockUpsert.mockResolvedValue({ id: "user-1" });

        const result = await authConfig.callbacks!.signIn!({
          user: { id: "12345", name: "Test User" },
          account: {
            access_token: "test-access-token",
            refresh_token: "test-refresh-token",
            expires_at: 1700000000, // Future timestamp
          },
          profile: undefined,
        } as never);

        expect(result).toBe(true);
        expect(mockUpsert).toHaveBeenCalledWith({
          where: { stravaId: 12345 },
          update: {
            name: "Test User",
            accessToken: "test-access-token",
            refreshToken: "test-refresh-token",
            tokenExpiry: expect.any(Date),
          },
          create: {
            stravaId: 12345,
            name: "Test User",
            accessToken: "test-access-token",
            refreshToken: "test-refresh-token",
            tokenExpiry: expect.any(Date),
          },
        });
      });

      it("should use 'Unknown' as default name", async () => {
        mockUpsert.mockResolvedValue({ id: "user-1" });

        await authConfig.callbacks!.signIn!({
          user: { id: "12345" },
          account: {
            access_token: "token",
            refresh_token: "refresh",
            expires_at: 1700000000,
          },
          profile: undefined,
        } as never);

        expect(mockUpsert).toHaveBeenCalledWith(
          expect.objectContaining({
            update: expect.objectContaining({
              name: "Unknown",
            }),
            create: expect.objectContaining({
              name: "Unknown",
            }),
          })
        );
      });
    });

    describe("jwt", () => {
      it("should add stravaId and accessToken to token on sign in", async () => {
        const token = { sub: "123" };
        const account = { access_token: "test-access-token" };
        const user = { id: "12345" };

        const result = await authConfig.callbacks!.jwt!({
          token,
          account,
          user,
          trigger: "signIn",
        } as never);

        expect(result.stravaId).toBe(12345);
        expect(result.accessToken).toBe("test-access-token");
      });

      it("should return unchanged token when no account", async () => {
        const token = { sub: "123", existing: "value" };

        const result = await authConfig.callbacks!.jwt!({
          token,
          account: null,
          user: null,
          trigger: "update",
        } as never);

        expect(result).toEqual(token);
      });
    });

    describe("session", () => {
      it("should add user id and accessToken to session from database", async () => {
        mockFindUnique.mockResolvedValue({
          id: "db-user-id",
          accessToken: "db-access-token",
        });

        const session = {
          user: { name: "Test User", email: "test@example.com" },
          expires: "2024-01-01",
        };
        const token = { stravaId: 12345 };

        const result = await authConfig.callbacks!.session!({
          session,
          token,
          user: undefined as never,
          trigger: "update",
          newSession: undefined,
        });

        expect(mockFindUnique).toHaveBeenCalledWith({
          where: { stravaId: 12345 },
        });
        expect(result.user.id).toBe("db-user-id");
        expect((result as { accessToken?: string }).accessToken).toBe("db-access-token");
      });

      it("should return session unchanged if no stravaId in token", async () => {
        const session = {
          user: { name: "Test User" },
          expires: "2024-01-01",
        };
        const token = {};

        const result = await authConfig.callbacks!.session!({
          session,
          token,
          user: undefined as never,
          trigger: "update",
          newSession: undefined,
        });

        expect(mockFindUnique).not.toHaveBeenCalled();
        expect(result).toEqual(session);
      });

      it("should return session unchanged if user not found in database", async () => {
        mockFindUnique.mockResolvedValue(null);

        const session = {
          user: { name: "Test User" },
          expires: "2024-01-01",
        };
        const token = { stravaId: 12345 };

        const result = await authConfig.callbacks!.session!({
          session,
          token,
          user: undefined as never,
          trigger: "update",
          newSession: undefined,
        });

        expect(mockFindUnique).toHaveBeenCalled();
        expect(result.user.id).toBeUndefined();
      });
    });
  });
});
