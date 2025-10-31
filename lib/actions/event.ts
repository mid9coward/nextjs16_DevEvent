"use server";

import Event from "@/database/event.model";

import connectMongoDB from "../mongodb";

export async function getSimilarEventsBySlug(slug: string) {
  try {
    await connectMongoDB();

    const event = await Event.findOne({ slug });
    console.log(event);

    const similarEvents = await Event.find({
      _id: { $ne: event._id },
      tags: { $in: event.tags },
    });

    return similarEvents;
  } catch (error) {
    return [];
  }
}
