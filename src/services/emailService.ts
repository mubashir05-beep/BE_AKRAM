import nodemailer from 'nodemailer';
import logger from '../config/logger';
import cron from 'node-cron';
import Subscriber from '../models/Subscriber';
import { Request, Response } from 'express';

// Subscriber service for managing subscriber data
class SubscriberService {
  async getActiveSubscribers(filters: { wantsDiscountEmails?: boolean } = {}): Promise<any[]> {
    try {
      const query: any = { isActive: true };
      
      if (filters.wantsDiscountEmails !== undefined) {
        query.wantsDiscountEmails = filters.wantsDiscountEmails;
      }
      
      return await Subscriber.find(query);
    } catch (error) {
      logger.error('Error fetching active subscribers:', error);
      return [];
    }
  }
}

const subscriberService = new SubscriberService();

// Function to get discount products (implementation would be elsewhere)
async function getDiscountProducts(): Promise<any[]> {
  return [
    {
      name: "Premium Headphones",
      originalPrice: 199.99,
      discountPrice: 149.99,
      description: "Noise-cancelling wireless headphones with superior sound quality."
    },
    {
      name: "Smart Watch",
      originalPrice: 299.99,
      discountPrice: 239.99,
      description: "Track your fitness and stay connected with our latest smart watch."
    }
  ];
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: parseInt(process.env.EMAIL_PORT || '587') === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    // Initialize daily discount email cron job
    this.initDailyDiscountEmailJob();
  }

  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from: `"Newsletter Service" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html
      });
      
      logger.info(`Email sent: ${info.messageId}`);
      return true;
    } catch (error) {
      logger.error('Error sending email:', error);
      return false;
    }
  }

  async sendBulkEmails(recipients: string[], subject: string, html: string): Promise<number> {
    let successCount = 0;
    
    for (const recipient of recipients) {
      const success = await this.sendEmail(recipient, subject, html);
      if (success) successCount++;
    }
    
    return successCount;
  }
  
  // Generate HTML for discount email
  generateDiscountEmailHTML(recipientName: string, discountProducts: any[]): string {
    // Format products for display
    let productsHTML = '';
    
    discountProducts.forEach(product => {
      productsHTML += `
        <div style="margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
          <h3 style="color: #333; margin-bottom: 5px;">${product.name}</h3>
          <p style="margin: 5px 0; font-size: 16px;">
            <span style="text-decoration: line-through; color: #999;">$${product.originalPrice.toFixed(2)}</span>
            <span style="color: #3AA39F; font-weight: bold; margin-left: 10px;">$${product.discountPrice.toFixed(2)}</span>
            <span style="background-color: #3AA39F; color: white; padding: 2px 6px; border-radius: 10px; font-size: 12px; margin-left: 8px;">
              ${Math.round((1 - product.discountPrice / product.originalPrice) * 100)}% OFF
            </span>
          </p>
          <p style="color: #666; margin-top: 5px;">${product.description}</p>
        </div>
      `;
    });
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Today's Special Discounts</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            margin: 0;
            padding: 0;
            background-color: #f9f9f9;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
          }
          .header {
            background-color: #3AA39F;
            padding: 20px;
            text-align: center;
          }
          .header h1 {
            color: #ffffff;
            margin: 0;
            font-weight: 300;
            font-size: 24px;
          }
          .content {
            padding: 30px;
          }
          .footer {
            background-color: #f5f5f5;
            padding: 15px;
            text-align: center;
            font-size: 12px;
            color: #666666;
          }
          .button {
            display: inline-block;
            background-color: #3AA39F;
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 25px;
            border-radius: 4px;
            margin: 20px 0;
            font-weight: bold;
          }
          .discount-badge {
            background-color: #3AA39F;
            color: white;
            padding: 2px 6px;
            border-radius: 10px;
            font-size: 12px;
          }
          .discount-timer {
            background-color: #f5f5f5;
            padding: 10px;
            border-radius: 4px;
            text-align: center;
            margin: 20px 0;
          }
          @media only screen and (max-width: 600px) {
            .container {
              width: 100%;
            }
            .content {
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Today's Special Discounts</h1>
          </div>
          <div class="content">
            <h2>Hello ${recipientName || 'Valued Customer'}!</h2>
            <p>We're excited to share today's special discounts with you. Don't miss out on these amazing deals!</p>
            
            <div class="discount-timer">
              <p style="margin: 0; font-weight: bold;">Today's Deals End In:</p>
              <p style="margin: 5px 0; font-size: 18px; color: #3AA39F;">12 hours</p>
            </div>
            
            ${productsHTML}
            
            <a href="${process.env.WEBSITE_URL || '#'}/products/discount" class="button">Shop All Discounts</a>
            
            <p>Happy shopping!</p>
            <p>Best regards,<br>The Team</p>
          </div>
          <div class="footer">
            <p>© 2025 Your Company. All rights reserved.</p>
            <p>To unsubscribe from discount notifications, <a href="${process.env.WEBSITE_URL || '#'}/unsubscribe?type=discount" style="color: #3AA39F;">click here</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
  
  // Send daily discount emails to all subscribers
  async sendDailyDiscountEmails(): Promise<void> {
    try {
      const subscribers = await subscriberService.getActiveSubscribers({ wantsDiscountEmails: true });
      
      // Get today's discounted products
      const discountProducts = await getDiscountProducts();
      
      if (discountProducts.length === 0) {
        logger.info('No discounted products available today, skipping discount email');
        return;
      }
      
      // Send emails
      const subject = `Today's Special Discounts - Up to ${Math.round((1 - discountProducts[0].discountPrice / discountProducts[0].originalPrice) * 100)}% OFF!`;
      
      // Generate personalized emails for each subscriber
      let successCount = 0;
      for (const subscriber of subscribers) {
        const html = this.generateDiscountEmailHTML(subscriber.firstName, discountProducts);
        const success = await this.sendEmail(subscriber.email, subject, html);
        if (success) successCount++;
      }
      
      logger.info(`Daily discount emails sent: ${successCount}/${subscribers.length}`);
    } catch (error) {
      logger.error('Error sending daily discount emails:', error);
    }
  }
  
  // Initialize cron job to send discount emails daily at noon
  initDailyDiscountEmailJob(): void {
    // Schedule job to run at 12:00 PM every day
    cron.schedule('0 12 * * *', async () => {
      logger.info('Running daily discount email job');
      await this.sendDailyDiscountEmails();
    });
    
    logger.info('Daily discount email job scheduled for 12:00 PM');
  }
}

// Create instances
const emailService = new EmailService();

// Subscriber controller methods
export const getAllSubscribers = async (req: Request, res: Response): Promise<void> => {
  try {
    const subscribers = await Subscriber.find({ isActive: true });
    res.status(200).json({ success: true, count: subscribers.length, data: subscribers });
  } catch (error) {
    logger.error('Error fetching subscribers:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getSubscriber = async (req: Request, res: Response): Promise<void> => {
  try {
    const subscriber = await Subscriber.findById(req.params.id);
    
    if (!subscriber) {
      res.status(404).json({ success: false, message: 'Subscriber not found' });
      return;
    }
    
    res.status(200).json({ success: true, data: subscriber });
  } catch (error) {
    logger.error(`Error fetching subscriber ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const createSubscriber = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, firstName, lastName, wantsDiscountEmails = true } = req.body;
    
    // Check if subscriber already exists
    const existingSubscriber = await Subscriber.findOne({ email });
    
    if (existingSubscriber) {
      res.status(400).json({ success: false, message: 'Email already subscribed' });
      return;
    }
    
    const subscriber = await Subscriber.create({
      email,
      firstName,
      lastName,
      wantsDiscountEmails,
      isActive: true,
      subscribedAt: new Date()
    });
    
    res.status(201).json({ success: true, data: subscriber });
  } catch (error) {
    logger.error('Error creating subscriber:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateSubscriber = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, isActive, wantsDiscountEmails } = req.body;
    
    const subscriber = await Subscriber.findByIdAndUpdate(
      req.params.id,
      { firstName, lastName, isActive, wantsDiscountEmails },
      { new: true, runValidators: true }
    );
    
    if (!subscriber) {
      res.status(404).json({ success: false, message: 'Subscriber not found' });
      return;
    }
    
    res.status(200).json({ success: true, data: subscriber });
  } catch (error) {
    logger.error(`Error updating subscriber ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteSubscriber = async (req: Request, res: Response): Promise<void> => {
  try {
    const subscriber = await Subscriber.findByIdAndUpdate(
      req.params.id,
      { isActive: false, unsubscribedAt: new Date() },
      { new: true }
    );
    
    if (!subscriber) {
      res.status(404).json({ success: false, message: 'Subscriber not found' });
      return;
    }
    
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    logger.error(`Error deleting subscriber ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Manual email sending endpoint (could be added to a controller)
export const sendManualDiscountEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { subscriberIds } = req.body;
    
    if (!subscriberIds || !Array.isArray(subscriberIds) || subscriberIds.length === 0) {
      res.status(400).json({ success: false, message: 'No subscribers specified' });
      return;
    }
    
    // Get subscribers
    const subscribers:any = await Subscriber.find({
      _id: { $in: subscriberIds },
      isActive: true
    });
    
    if (subscribers.length === 0) {
      res.status(404).json({ success: false, message: 'No active subscribers found' });
      return;
    }
    
    // Get discount products
    const discountProducts = await getDiscountProducts();
    
    if (discountProducts.length === 0) {
      res.status(404).json({ success: false, message: 'No discount products available' });
      return;
    }
    
    // Send emails
    const subject = `Special Offer - Up to ${Math.round((1 - discountProducts[0].discountPrice / discountProducts[0].originalPrice) * 100)}% OFF!`;
    
    let successCount = 0;
    for (const subscriber of subscribers) {
      const html = emailService.generateDiscountEmailHTML(subscriber.firstName, discountProducts);
      const success = await emailService.sendEmail(subscriber.email, subject, html);
      if (success) successCount++;
    }
    
    res.status(200).json({ 
      success: true, 
      message: `Emails sent successfully: ${successCount}/${subscribers.length}`
    });
  } catch (error) {
    logger.error('Error sending manual discount emails:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export { emailService, subscriberService };