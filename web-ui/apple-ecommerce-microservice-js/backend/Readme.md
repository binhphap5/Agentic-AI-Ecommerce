🚀 Project Setup & API Documentation

🛠️ How to Run the Project

Step 1: Navigate to the backend folder
```bash
cd path/to/backend
```
Bước 2: Build và chạy các service bằng Docker Compose

docker-compose up --build -d

Bước 3: Truy cập hệ thống
truy cập qua:

http://localhost

Hoặc từng service như:

user-service: http://localhost/api/users

order-service: http://localhost/api/orders

## 🔐 User Authentication – /api/users

POST   /api/users/register           --------- Register new user

POST   /api/users/login              --------- Login with email & password

POST   /api/users/google-login       --------- Login with Google OAuth

POST   /api/users/send-otp           --------- Send OTP for password reset

POST   /api/users/verify-otp         --------- Verify OTP

POST   /api/users/reset-password     --------- Reset password using OTP

## 🛒 Cart – /api/cart

POST   /api/cart/:userId/add                      --------- Add product to user's cart

GET    /api/cart/:userId                          --------- Get all items in user's cart

DELETE /api/cart/:userId/remove/:productId        --------- Remove single item from cart

POST   /api/cart/:userId/bulk-remove              --------- Remove multiple items from cart

PUT    /api/cart/:userId/update/:productId        --------- Update quantity or size of cart item

## 📦 Products – /api/products

POST   /api/products/create                       --------- Create a new product

POST   /api/products/bulk-create                  --------- Create multiple products

GET    /api/products/get                          --------- Get distinct product list

GET    /api/products/:id                          --------- Get product by ID

PUT    /api/products/update/:id                   --------- Update product details

DELETE /api/products/delete/:id                   --------- Delete a product

DELETE /api/products/bulk-delete                  --------- Delete multiple products

GET    /api/products/by-name/:name                --------- Get variants by product name

POST   /api/products/:id/comments                 --------- Add a comment to a product

DELETE /api/products/:id/comments/:commentIndex   --------- Delete a specific comment

GET    /api/products/:id/rating                   --------- Get rating summary for product

## 🧾 Orders – /api/orders

POST   /api/orders/:userId                        --------- Create order from cart

GET    /api/orders/:userId                        --------- Get user's orders

GET    /api/orders/:userId/:orderId               --------- Get specific order details

PUT    /api/orders/:orderId/status                --------- Update order status

## 💳 Payments – /api/payments

POST   /api/payments/:orderId                     --------- Initiate MoMo ATM payment

POST   /api/payments/callback                     --------- Receive MoMo IPN callback

GET    /api/payments/:paymentId                   --------- Get payment result

POST   /api/payments/mock-success/:orderId        --------- Simulate payment success (testing)

## 📣 Notifications – /api/notification

POST   /api/notification/email                    --------- Send email notification

POST   /api/notification/sms                      --------- Send SMS notification
