import express from 'express';
import {
  createOrder,
  getOrder,
  getCustomerOrders,
  updateOrderStatus,
  updatePaymentStatus
} from '../controllers/orderController';

const router = express.Router();

router.route('/')
  .post(createOrder);

router.route('/:id')
  .get(getOrder);

router.route('/customer/:email')
  .get(getCustomerOrders);

router.route('/:id/status')
  .put(updateOrderStatus);

router.route('/:id/payment')
  .put(updatePaymentStatus);

export default router;