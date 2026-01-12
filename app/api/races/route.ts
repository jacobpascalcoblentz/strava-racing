import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import { checkRateLimit, getRateLimitKey, rateLimitResponse, apiRateLimitConfig } from "@/lib/rate-limit";
import { z } from "zod";

const createRaceSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less")
    .regex(/^[a-zA-Z0-9\s\-_]+$/, "Name can only contain letters, numbers, spaces, hyphens, and underscores"),
  description: z
    .string()
    .max(1000, "Description must be 1000 characters or less")
    .optional()
    .nullable(),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid start date"),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid end date"),
});

export async function POST(request: Request) {
  // Rate limit API requests
  const rateLimitKey = getRateLimitKey(request);
  const rateLimit = checkRateLimit(rateLimitKey, apiRateLimitConfig);
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetTime);
  }

  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Validate input
    const parseResult = createRaceSchema.safeParse(body);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      return NextResponse.json(
        { error: firstIssue?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { name, description, startDate, endDate } = parseResult.data;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      );
    }

    // Prevent races too far in the future (1 year max)
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    if (end > oneYearFromNow) {
      return NextResponse.json(
        { error: "Race end date cannot be more than 1 year in the future" },
        { status: 400 }
      );
    }

    // Generate a unique slug
    const slug = `${name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 30)}-${nanoid(6)}`;

    const race = await prisma.race.create({
      data: {
        name,
        description: description || null,
        slug,
        startDate: start,
        endDate: end,
        organizerId: session.user.id,
      },
    });

    return NextResponse.json(race);
  } catch {
    return NextResponse.json(
      { error: "Failed to create race" },
      { status: 500 }
    );
  }
}
