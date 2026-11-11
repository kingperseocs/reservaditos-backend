import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { UserRole } from '../domain/user';

@Schema({ _id: false })
export class DueRecord {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  amount: number;

  /** yyyy-MM-dd */
  @Prop({ required: true })
  dueDate: string;

  @Prop({ type: Date, default: null })
  paidAt: Date | null;
}

@Schema({ collection: 'users', versionKey: false, timestamps: true })
export class UserRecord {
  @Prop({ type: String })
  _id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: Object.values(UserRole), type: String })
  role: UserRole;

  @Prop({ type: String, default: null })
  apartment: string | null;

  @Prop({ type: [SchemaFactory.createForClass(DueRecord)], default: [] })
  dues: DueRecord[];
}

export const UserSchema = SchemaFactory.createForClass(UserRecord);
