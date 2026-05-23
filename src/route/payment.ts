import { paymentIntent } from "@/controller/payment";
import { Router } from "express";

const paymentRouter = Router()

paymentRouter.post("/intent", paymentIntent)

export default paymentRouter