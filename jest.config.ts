import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: "./",
});

const config: Config = {
  coverageProvider: "v8",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/e2e/",
    "<rootDir>/__tests__/fixtures.ts",
    "<rootDir>/__tests__/mocks/",
  ],
  collectCoverageFrom: [
    "lib/**/*.{js,ts}",
    "components/**/*.{js,ts,tsx}",
    "app/api/**/*.{js,ts}",
    "!**/*.d.ts",
  ],
};

// Create the base config
const jestConfig = createJestConfig(config);

// Export a function that modifies the final config to ensure transformIgnorePatterns includes jose
export default async () => {
  const finalConfig = await jestConfig();
  // Override transformIgnorePatterns to include jose
  finalConfig.transformIgnorePatterns = [
    "/node_modules/(?!(jose|nanoid)/)",
    "^.+\\.module\\.(css|sass|scss)$",
  ];
  return finalConfig;
};
