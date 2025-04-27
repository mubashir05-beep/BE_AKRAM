import Order, { OrderDocument } from "../models/Order";

import { IOrderItem } from "../types";
import logger from "../config/logger";
import { emailService } from "./emailService";

class OrderService {
  async createOrder(orderData: {
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
  }): Promise<OrderDocument> {
    try {
      const order = await Order.create({
        ...orderData,
        status: "pending",
        paymentStatus: "pending",
        orderedAt: new Date(),
      });

      await this.sendOrderConfirmationEmail(order);

      return order;
    } catch (error) {
      logger.error("Error creating order:", error);
      throw error;
    }
  }

  async getOrderById(orderId: string): Promise<OrderDocument | null> {
    try {
      return await Order.findById(orderId);
    } catch (error) {
      logger.error(`Error fetching order with id ${orderId}:`, error);
      throw error;
    }
  }

  async getOrdersByCustomerEmail(email: string): Promise<OrderDocument[]> {
    try {
      return await Order.find({ customerEmail: email }).sort({ orderedAt: -1 });
    } catch (error) {
      logger.error(`Error fetching orders for customer ${email}:`, error);
      throw error;
    }
  }

  async updateOrderStatus(
    orderId: string,
    status: string
  ): Promise<OrderDocument | null> {
    try {
      const order = await Order.findByIdAndUpdate(
        orderId,
        { status },
        { new: true }
      );

      if (
        order &&
        (status === "processing" ||
          status === "shipped" ||
          status === "delivered")
      ) {
        await this.sendOrderStatusUpdateEmail(order);
      }

      return order;
    } catch (error) {
      logger.error(`Error updating order status for order ${orderId}:`, error);
      throw error;
    }
  }

  async updatePaymentStatus(
    orderId: string,
    paymentStatus: string
  ): Promise<OrderDocument | null> {
    try {
      const order = await Order.findByIdAndUpdate(
        orderId,
        { paymentStatus },
        { new: true }
      );

      if (order && paymentStatus === "paid") {
        await this.sendPaymentConfirmationEmail(order);
      }

      return order;
    } catch (error) {
      logger.error(
        `Error updating payment status for order ${orderId}:`,
        error
      );
      throw error;
    }
  }

  private async sendOrderConfirmationEmail(
    order: OrderDocument
  ): Promise<boolean> {
    const subject = "Your order has been placed successfully!";
    const html = this.generateOrderConfirmationEmailTemplate(order);

    return await emailService.sendEmail(order.customerEmail, subject, html);
  }

  private async sendOrderStatusUpdateEmail(
    order: OrderDocument
  ): Promise<boolean> {
    const subject = `Order Status Update: Your order is now ${order.status}`;
    const html = this.generateOrderStatusUpdateEmailTemplate(order);

    return await emailService.sendEmail(order.customerEmail, subject, html);
  }

  private async sendPaymentConfirmationEmail(
    order: OrderDocument
  ): Promise<boolean> {
    const subject = "Payment Confirmation";
    const html = this.generatePaymentConfirmationEmailTemplate(order);

    return await emailService.sendEmail(order.customerEmail, subject, html);
  }

  private generateOrderConfirmationEmailTemplate(order: any): string {
    // Convert Decimal128 values to numbers for formatting
    // For Decimal128 objects, we need to use the toString() method first and then parse it
    const subtotal =
      order.subtotal && typeof order.subtotal.toString === "function"
        ? parseFloat(order.subtotal.toString())
        : parseFloat(order.subtotal) || 0;

    const tax =
      order.tax && typeof order.tax.toString === "function"
        ? parseFloat(order.tax.toString())
        : parseFloat(order.tax) || 0;

    const shippingCost =
      order.shippingCost && typeof order.shippingCost.toString === "function"
        ? parseFloat(order.shippingCost.toString())
        : parseFloat(order.shippingCost) || 0;

    const totalAmount = parseFloat(order.totalAmount) || 0;

    // Calculate subtotal from items if it's zero
    const calculatedSubtotal =
      subtotal === 0
        ? order.items.reduce((sum: number, item: any) => {
            const price = parseFloat(item.price) || 0;
            const quantity = parseInt(item.quantity) || 0;
            return sum + price * quantity;
          }, 0)
        : subtotal;

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Order Confirmation</h2>
        <p>Dear ${order.customerName},</p>
        <p>Thank you for your order! We've received your order and are processing it now.</p>
        
        <h3>Order Details:</h3>
        <p><strong>Order ID:</strong> ${order._id}</p>
        <p><strong>Order Date:</strong> ${new Date(
          order.orderedAt
        ).toLocaleDateString()}</p>
        
        <h3>Items:</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Product</th>
              <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Quantity</th>
              <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Price</th>
              <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items
              .map((item: any) => {
                const price = parseFloat(item.price) || 0;
                const quantity = parseInt(item.quantity) || 0;
                return `
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd;">${
                    item.productName
                  }</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${quantity}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">$${price.toFixed(
                    2
                  )}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">$${(
                    price * quantity
                  ).toFixed(2)}</td>
                </tr>
              `;
              })
              .join("")}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="padding: 8px; text-align: right; border: 1px solid #ddd;"><strong>Subtotal:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">$${calculatedSubtotal.toFixed(
                2
              )}</td>
            </tr>
            <tr>
              <td colspan="3" style="padding: 8px; text-align: right; border: 1px solid #ddd;"><strong>Tax:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">$${tax.toFixed(
                2
              )}</td>
            </tr>
            <tr>
              <td colspan="3" style="padding: 8px; text-align: right; border: 1px solid #ddd;"><strong>Shipping:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">$${shippingCost.toFixed(
                2
              )}</td>
            </tr>
            <tr>
              <td colspan="3" style="padding: 8px; text-align: right; border: 1px solid #ddd;"><strong>Total:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>$${totalAmount.toFixed(
                2
              )}</strong></td>
            </tr>
          </tfoot>
        </table>
        
        <h3>Shipping Address:</h3>
        <p>
          ${order.shippingAddress.street}<br>
          ${order.shippingAddress.city}, ${order.shippingAddress.state} ${
      order.shippingAddress.postalCode
    }<br>
          ${order.shippingAddress.country}
        </p>
        
        <p>We'll update you when your order ships.</p>
        <p>If you have any questions, please contact our customer service.</p>
        
        <p>Thank you for shopping with us!</p>
      </div>
    `;
  }

  private generateOrderStatusUpdateEmailTemplate(order: OrderDocument): string {
    let statusMessage = "";

    switch (order.status) {
      case "processing":
        statusMessage = "We are now preparing your order for shipment.";
        break;
      case "shipped":
        statusMessage =
          "Great news! Your order has been shipped and is on its way to you.";
        break;
      case "delivered":
        statusMessage =
          "Your order has been delivered. We hope you enjoy your purchase!";
        break;
      default:
        statusMessage = `Your order status has been updated to: ${order.status}`;
    }

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Order Status Update</h2>
        <p>Dear ${order.customerName},</p>
        <p>${statusMessage}</p>
        
        <h3>Order Details:</h3>
        <p><strong>Order ID:</strong> ${order._id}</p>
        <p><strong>Order Date:</strong> ${new Date(
          order.orderedAt
        ).toLocaleDateString()}</p>
        <p><strong>Current Status:</strong> ${order.status}</p>
        
        <p>Thank you for shopping with us!</p>
      </div>
    `;
  }

  private generatePaymentConfirmationEmailTemplate(
    order: OrderDocument
  ): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Payment Confirmation</h2>
        <p>Dear ${order.customerName},</p>
        <p>We're writing to confirm that we've received your payment for order #${
          order._id
        }.</p>
        
        <h3>Payment Details:</h3>
        <p><strong>Order ID:</strong> ${order._id}</p>
        <p><strong>Payment Amount:</strong> $${order.totalAmount.toFixed(2)}</p>
        <p><strong>Payment Status:</strong> ${order.paymentStatus}</p>
        
        <p>Thank you for your purchase!</p>
      </div>
    `;
  }
}

export default new OrderService();
