import { Schema, model, models, Document, Types } from 'mongoose';

// TypeScript interface for Booking model
interface IBooking extends Document {
  eventId: Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

// Email validation regex
function isValidEmail(email: string): boolean {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
}

const BookingSchema = new Schema<IBooking>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      validate: {
        validator: isValidEmail,
        message: 'Invalid email format',
      },
    },
  },
  { timestamps: true }
);

// Pre-save hook: verify referenced event exists
BookingSchema.pre('save', async function (next) {
  if (this.isModified('eventId') || this.isNew) {
    const Event = models.Event || model('Event');
    const eventExists = await Event.findById(this.eventId);
    
    if (!eventExists) {
      throw new Error('Referenced event does not exist');
    }
  }
  next();
});

// Index on eventId for efficient queries
BookingSchema.index({ eventId: 1 });

const Booking = models.Booking || model<IBooking>('Booking', BookingSchema);

export default Booking;