import { v2 as cloudinary } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";

import connectMongoDB from "@/lib/mongodb";
import Event from "@/database/event.model";

export async function POST(req: NextRequest) {
  try {
    await connectMongoDB();

    // Get form-data
    const formData = await req.formData();

    // Parse form-data
    let event;
    try {
      event = Object.fromEntries(formData.entries());
    } catch {
      return NextResponse.json(
        { message: "Invalid JSON data format" },
        { status: 400 }
      );
    }

    // Get the uploaded file
    const file = formData.get("image") as File;
    if (!file) {
      return NextResponse.json(
        { message: "Image file is required" },
        { status: 400 }
      );
    }

    // Get tags
    let tags;
    try {
      tags = JSON.parse(formData.get("tags") as string);
    } catch {
      return NextResponse.json(
        { message: "Invalid tags format" },
        { status: 400 }
      );
    }

    // Get Agenda
    let agenda;
    try {
      agenda = JSON.parse(formData.get("agenda") as string);
    } catch {
      return NextResponse.json(
        { message: "Invalid agenda format" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary using upload_stream
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "image",
            folder: "DevEvent",
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        )
        .end(buffer);
    });

    // Add the Cloudinary URL to event data
    event.image = (uploadResult as { secure_url: string }).secure_url;

    // Create the event in the database
    const createdEvent = await Event.create({
      ...event,
      tags,
      agenda,
    });

    return NextResponse.json(
      { message: "Event created successfully", event: createdEvent },
      { status: 201 }
    );
  } catch (error) {
    console.error("Event creation failed:", error);
    return NextResponse.json(
      {
        message: "Event creation failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectMongoDB();

    const events = await Event.find().sort({ createdAt: -1 });
    return NextResponse.json(
      { message: "Events fetched", events },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Event fetching failed", error },
      { status: 500 }
    );
  }
}
