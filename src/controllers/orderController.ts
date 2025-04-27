import { Request, Response } from 'express';
import orderService from '../services/orderService';
import logger from '../config/logger';

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      customerEmail,
      customerName,
      items,
      totalAmount,
      shippingAddress
    } = req.body;

    // Calculate total amount from items as a validation
    const calculatedTotal = items.reduce((sum: number, item: any) => {
      return sum + (item.price * item.quantity);
    }, 0);

    // Ensure the provided total matches calculated total
    // if (Math.abs(calculatedTotal - totalAmount) > 0.01) {
    //   res.status(400).json({ 
    //     success: false, 
    //     message: 'Total amount does not match sum of items' 
    //   });
    //   return;
    // }

    const order = await orderService.createOrder({
      customerEmail,
      customerName,
      items,
      totalAmount,
      shippingAddress
    });

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    logger.error('Error creating order:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }
    
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    logger.error(`Error fetching order ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getCustomerOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.params;
    const orders = await orderService.getOrdersByCustomerEmail(email);
    
    res.status(200).json({ 
      success: true, 
      count: orders.length, 
      data: orders 
    });
  } catch (error) {
    logger.error(`Error fetching orders for customer ${req.params.email}:`, error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'processing', 'shipped', 'delivered', 'canceled'].includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid order status' });
      return;
    }
    
    const order = await orderService.updateOrderStatus(req.params.id, status);
    
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }
    
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    logger.error(`Error updating order ${req.params.id} status:`, error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updatePaymentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { paymentStatus } = req.body;
    
    if (!['pending', 'paid', 'failed', 'refunded'].includes(paymentStatus)) {
      res.status(400).json({ success: false, message: 'Invalid payment status' });
      return;
    }
    
    const order = await orderService.updatePaymentStatus(req.params.id, paymentStatus);
    
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }
    
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    logger.error(`Error updating order ${req.params.id} payment status:`, error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};