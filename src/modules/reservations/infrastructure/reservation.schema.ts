import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ReservationStatus } from '../domain/reservation-status';

@Schema({ collection: 'reservations', versionKey: false, timestamps: true })
export class ReservationRecord {
  @Prop({ type: String })
  _id: string;

  @Prop({ required: true, index: true })
  residentId: string;

  @Prop({ required: true })
  areaId: string;

  /** yyyy-MM-dd in the building time zone */
  @Prop({ required: true })
  date: string;

  @Prop({ required: true })
  slotStart: string;

  @Prop({ required: true })
  slotEnd: string;

  /** areaId|date|slotStart — groups requests that compete for the same slot. */
  @Prop({ required: true, index: true })
  slotKey: string;

  /**
   * Equals slotKey only while the booking holds the slot (APPROVED/CONFIRMED).
   * A unique partial index makes "one holder per slot" atomic (rule 4).
   */
  @Prop({ type: String })
  slotLock?: string;

  @Prop({ required: true })
  eventStart: Date;

  @Prop({ required: true })
  fee: number;

  @Prop({ required: true })
  deposit: number;

  @Prop({
    required: true,
    enum: Object.values(ReservationStatus),
    type: String,
  })
  status: ReservationStatus;

  @Prop({ required: true })
  requestedAt: Date;

  @Prop({ type: Date, default: null })
  approvedAt: Date | null;

  @Prop({ type: Date, default: null })
  paymentDeadline: Date | null;

  @Prop({ type: String, default: null })
  paymentToken: string | null;

  @Prop({ type: Date, default: null })
  paidAt: Date | null;

  @Prop({ type: String, default: null })
  code: string | null;

  @Prop({ type: Date, default: null })
  rejectedAt: Date | null;

  @Prop({ type: String, default: null })
  rejectionReason: string | null;

  @Prop({ type: Date, default: null })
  expiredAt: Date | null;

  @Prop({ type: Date, default: null })
  refundedAt: Date | null;

  @Prop({ type: Number, default: null })
  refundAmount: number | null;
}

export const ReservationSchema =
  SchemaFactory.createForClass(ReservationRecord);

ReservationSchema.index(
  { slotLock: 1 },
  { unique: true, partialFilterExpression: { slotLock: { $type: 'string' } } },
);
ReservationSchema.index(
  { paymentToken: 1 },
  {
    unique: true,
    partialFilterExpression: { paymentToken: { $type: 'string' } },
  },
);
ReservationSchema.index({ status: 1, paymentDeadline: 1 });
ReservationSchema.index({ areaId: 1, date: 1 });
