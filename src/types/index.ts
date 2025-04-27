import mongoose, { Decimal128 } from "mongoose";

export interface ISubscriber {
    email: string;
    firstName?: string;
    lastName?: string;
    isActive: boolean;
    tags: string[];
    subscribedAt: Date;
    unsubscribedAt?: Date;
  }
  
  export interface IEmailTemplate {
    name: string;
    subject: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface ICampaign {
    name: string;
    subject: string;
    content: string;
    tags: string[];
    sentAt?: Date;
    status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
    scheduledFor?: Date;
    stats: {
      sent: number;
      delivered: number;
      opened: number;
      clicked: number;
    };
  }
  export interface IOrderItem {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }
  
  export interface IOrder {
    customerId: mongoose.Types.ObjectId;
    customerEmail: string;
    customerName: string;
    items: IOrderItem[];
    totalAmount: number;
    shippingAddress: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'canceled';
    paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
    orderedAt: Date;
    updatedAt: Date;
    shippingCost: Decimal128;
    subtotal: Decimal128;
    tax: Decimal128;
  }