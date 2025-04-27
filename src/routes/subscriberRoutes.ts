import express from "express";
import {
  getAllSubscribers,
  getSubscriber,
  createSubscriber,
  updateSubscriber,
  deleteSubscriber,
} from "../controllers/subscriberController";

const router = express.Router();

router.route("/").get(getAllSubscribers).post(createSubscriber);

router
  .route("/:id")
  .get(getSubscriber)
  .put(updateSubscriber)
  .delete(deleteSubscriber);

export default router;
