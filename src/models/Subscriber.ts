import mongoose, { Schema, Document } from 'mongoose';
import { ISubscriber } from '../types';


export interface SubscriberDocument extends ISubscriber, Document {}

const subscriberSchema = new Schema<SubscriberDocument>({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },

  subscribedAt: {
    type: Date,
    default: Date.now
  },
  unsubscribedAt: {
    type: Date
  }
}, { timestamps: true });

const Subscriber = mongoose.model<SubscriberDocument>('Subscriber', subscriberSchema);

export default Subscriber;