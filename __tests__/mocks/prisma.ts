// Mock Prisma client for testing

import { mockUser, mockRace, mockSegment, mockParticipant, mockEffort } from "../fixtures";

export const prismaMock = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
  },
  race: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  raceSegment: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  raceParticipant: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  segmentEffort: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    upsert: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(prismaMock)),
};

// Helper to reset all mocks
export function resetPrismaMock() {
  Object.values(prismaMock).forEach((model) => {
    if (typeof model === "object" && model !== null) {
      Object.values(model).forEach((method) => {
        if (typeof method === "function" && "mockReset" in method) {
          (method as jest.Mock).mockReset();
        }
      });
    }
  });
}

// Helper to set up common mock returns
export function setupBasicMocks() {
  prismaMock.user.findUnique.mockResolvedValue(mockUser);
  prismaMock.race.findUnique.mockResolvedValue({
    ...mockRace,
    organizer: mockUser,
    segments: [mockSegment],
    participants: [{ ...mockParticipant, user: mockUser }],
  });
  prismaMock.raceSegment.findFirst.mockResolvedValue(null);
  prismaMock.raceSegment.create.mockResolvedValue(mockSegment);
  prismaMock.segmentEffort.findMany.mockResolvedValue([mockEffort]);
}

// Mock the actual prisma module
jest.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));
