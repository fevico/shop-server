import ProductModel from "@/model/product";
import { RequestHandler } from "express";
import https from "https";

export const paymentIntent: RequestHandler = async (req, res) => {
  try {
    const { email, name, items } = req.body;

// const totalAmount = items.reduce(
//   (acc: number, item: any) => {
//     return acc + (item.price * item.quantity);
//   },
//   0
// );

let totalAmount = 0;

for (const item of items) {

  const product = await ProductModel.findById(item.productId);

  if (!product) {
    return res.status(404).json({
      message: "Product not found"
    });
  }

  totalAmount += product.price * item.quantity;
}

const params = JSON.stringify({
  email,
  amount: totalAmount * 100,
  name,
  callback_url: "http://localhost:5173/payment-successful"
});

    const options = {
      hostname: "api.paystack.co",
      port: 443,
      path: "/transaction/initialize",
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET!}`,
        "Content-Type": "application/json"
      }
    };

    const paystackReq = https.request(options, (paystackRes) => {

      let data = "";

      paystackRes.on("data", (chunk) => {
        data += chunk;
      });

      paystackRes.on("end", () => {
        try {

          const response = JSON.parse(data);

          console.log(response);

          res.status(200).json(response);

        } catch (error) {

          console.log("Raw response:", data);

          res.status(500).json({
            message: "Invalid JSON response from Paystack"
          });
        }
      });

    });

    paystackReq.on("error", (error) => {
      console.error(error);

      res.status(500).json({
        message: "Payment request failed"
      });
    });

    paystackReq.write(params);
    paystackReq.end();

  } catch (error) {

    console.log("payment failed", error);

    res.status(500).json({
      message: "Internal server error"
    });
  }
};