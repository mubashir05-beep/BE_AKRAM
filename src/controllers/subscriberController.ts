import { Request, Response } from 'express';
import Subscriber from '../models/Subscriber';
import logger from '../config/logger';

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
    const { email, firstName, lastName } = req.body;
    
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
    const { firstName, lastName, isActive } = req.body;
    
    const subscriber = await Subscriber.findByIdAndUpdate(
      req.params.id,
      { firstName, lastName,  isActive },
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