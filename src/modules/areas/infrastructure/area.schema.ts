import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class SlotRecord {
  @Prop({ required: true })
  start: string;

  @Prop({ required: true })
  end: string;
}

@Schema({ _id: false })
export class SuspensionRecord {
  @Prop({ required: true })
  id: string;

  /** yyyy-MM-dd */
  @Prop({ required: true })
  from: string;

  /** yyyy-MM-dd */
  @Prop({ required: true })
  to: string;

  @Prop({ required: true })
  reason: string;

  @Prop({ required: true })
  createdAt: Date;
}

@Schema({ collection: 'areas', versionKey: false, timestamps: true })
export class AreaRecord {
  @Prop({ type: String })
  _id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  icon: string;

  @Prop({ required: true, min: 0 })
  fee: number;

  @Prop({ required: true, min: 0 })
  deposit: number;

  @Prop({ type: [SchemaFactory.createForClass(SlotRecord)], default: [] })
  slots: SlotRecord[];

  @Prop({ type: [Number], default: [1, 2, 3, 4, 5, 6, 7] })
  openWeekdays: number[];

  @Prop({ type: [SchemaFactory.createForClass(SuspensionRecord)], default: [] })
  suspensions: SuspensionRecord[];
}

export const AreaSchema = SchemaFactory.createForClass(AreaRecord);
