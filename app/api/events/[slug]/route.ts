import { Event } from "@/database";
import connectMongoDB from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

// Type for error response
interface ErrorResponse {
  error: string;
  message?: string;
}

// Type for success response
interface EventResponse {
  success: true;
  data: {
    _id: string;
    title: string;
    slug: string;
    description: string;
    overview: string;
    image: string;
    venue: string;
    location: string;
    date: string;
    time: string;
    mode: string;
    audience: string;
    agenda: string[];
    organizer: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
  };
}

/**
 * GET /api/events/[slug]
 * Fetch event details by slug
 */
export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/events/[slug]">
): Promise<NextResponse<EventResponse | ErrorResponse>> {
  try {
    const { slug } = await ctx.params;

    if (!slug || typeof slug !== "string" || slug.trim().length === 0) {
      return NextResponse.json(
        {
          error: "Invalid slug",
          message: "Slug parameter is required and must be a non-empty string",
        },
        { status: 400 }
      );
    }

    // Sanitize slug (remove any potentially harmful characters)
    const sanitizedSlug = slug.trim().toLowerCase();

    // Validate slug format (URL-friendly characters only)
    if (!/^[a-z0-9-]+$/.test(sanitizedSlug)) {
      return NextResponse.json(
        {
          error: "Invalid slug format",
          message:
            "Slug must contain only lowercase letters, numbers, and hyphens",
        },
        { status: 400 }
      );
    }

    // Connect to database
    await connectMongoDB();

    // Query event by slug
    const event = await Event.findOne({ slug: sanitizedSlug });

    // Handle event not found
    if (!event) {
      return NextResponse.json(
        {
          error: "Event not found",
          message: `No event found with slug: ${sanitizedSlug}`,
        },
        { status: 404 }
      );
    }

    // Return successful response
    return NextResponse.json(
      {
        success: true,
        data: event,
      },
      { status: 200 }
    );
  } catch (error) {
    // Log error for debugging (in production, use proper logging service)
    console.error("Error fetching event by slug:", error);

    // Handle specific MongoDB/Mongoose errors
    if (error instanceof Error) {
      // Database connection errors
      if (error.message.includes("connection")) {
        return NextResponse.json(
          {
            error: "Database connection failed",
            message: "Unable to connect to database",
          },
          { status: 503 }
        );
      }

      // Validation errors
      if (error.name === "ValidationError") {
        return NextResponse.json(
          {
            error: "Validation error",
            message: error.message,
          },
          { status: 400 }
        );
      }
    }

    // Generic server error for unexpected issues
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "An unexpected error occurred while fetching the event",
      },
      { status: 500 }
    );
  }
}
