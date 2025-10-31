import { Schema, model, models, Document } from "mongoose";

// TypeScript interface for Event model
export interface IEvent extends Document {
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
}

// Generate URL-friendly slug from title
function createSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Normalize date to ISO format
function normalizeDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new Error("Invalid date format");
  }
  return date.toISOString().split("T")[0];
}

// Normalize time to HH:MM format
function normalizeTime(timeStr: string): string {
  const time24 = timeStr.replace(/\s*(AM|PM)\s*/i, (match, period) => {
    const [hours, minutes] = timeStr.replace(/\s*(AM|PM)\s*/i, "").split(":");
    let hour = parseInt(hours);
    if (period.toUpperCase() === "PM" && hour !== 12) hour += 12;
    if (period.toUpperCase() === "AM" && hour === 12) hour = 0;
    return "";
  });

  const [hours, minutes] = timeStr.replace(/\s*(AM|PM)\s*/i, "").split(":");
  let hour = parseInt(hours);

  if (/PM/i.test(timeStr) && hour !== 12) hour += 12;
  if (/AM/i.test(timeStr) && hour === 12) hour = 0;

  return `${hour.toString().padStart(2, "0")}:${minutes.padStart(2, "0")}`;
}

const EventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    overview: {
      type: String,
      required: [true, "Overview is required"],
      trim: true,
    },
    image: {
      type: String,
      required: [true, "Image is required"],
      trim: true,
    },
    venue: {
      type: String,
      required: [true, "Venue is required"],
      trim: true,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    date: {
      type: String,
      required: [true, "Date is required"],
    },
    time: {
      type: String,
      required: [true, "Time is required"],
    },
    mode: {
      type: String,
      required: [true, "Mode is required"],
      enum: ["online", "offline", "hybrid"],
    },
    audience: {
      type: String,
      required: [true, "Audience is required"],
      trim: true,
    },
    agenda: {
      type: [String],
      required: [true, "Agenda is required"],
      validate: {
        validator: (arr: string[]) => arr.length > 0,
        message: "Agenda must have at least one item",
      },
    },
    organizer: {
      type: String,
      required: [true, "Organizer is required"],
      trim: true,
    },
    tags: {
      type: [String],
      required: [true, "Tags are required"],
      validate: {
        validator: (arr: string[]) => arr.length > 0,
        message: "Tags must have at least one item",
      },
    },
  },
  { timestamps: true }
);

// Pre-save hook: generate slug, normalize date and time
EventSchema.pre("save", function (next) {
  // Generate slug only if title changed
  if (this.isModified("title")) {
    this.slug = createSlug(this.title);
  }

  // Normalize date to ISO format
  if (this.isModified("date")) {
    this.date = normalizeDate(this.date);
  }

  // Normalize time to consistent HH:MM format
  if (this.isModified("time")) {
    this.time = normalizeTime(this.time);
  }

  next();
});

// Unique index on slug
// EventSchema.index({ slug: 1 }, { unique: true });

const Event = models.Event || model<IEvent>("Event", EventSchema);

export default Event;
