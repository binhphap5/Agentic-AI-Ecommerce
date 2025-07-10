# ⭐️ Scalable E-commerce Backend (Microservices)
## 🧰 Tech Stack
Node.js, Express.js – Backend framework

MongoDB, Mongoose – Database & ODM

Docker, Docker Compose – Containerization

Nginx – API Gateway & Load Balancer

<!-- Kubernetes – Container orchestration

 -->

GitHub Actions – CI/CD pipeline

## 🧩 Services & Features

| Service              |Description                                                  |
|----------------------|--------------------------------------------------------------|
| **User Service**       | User registration, login, JWT authentication, argon2 password hashing |
| **Product Service**  | Manage product listings, categories, inventory               |
| **Shopping Cart Service** | Add/remove/update items in user carts                      |
| **Order Service**    | Place orders, track status, manage order history             |
| **Payment Service**  | Integrate Stripe for secure payment handling                 |
| **Notification Service** | Send email (via NodeMailer) notifications |

## ⚙️ Architecture Overview
### Microservices Architecture:
Each service is an independent codebase with its own database and container.

### API Gateway & Load Balancing:
Nginx handles routing and balances load between multiple service instances.

### Containerization:
Docker ensures consistent environments and isolated service deployments.

<!-- ### Deployment with Kubernetes:
Each service runs in its own pod. Kubernetes handles auto-scaling, fault tolerance, and rolling updates. -->

### CI/CD Pipeline:
GitHub Actions automates builds, tests, and deployment to Docker Hub or a container registry.

### Authentication & Authorization:
JWT tokens are used for auth; passwords are hashed securely using argon2.

## ✅ Pre-requisites
Docker & Docker Compose installed:

docker --version

docker compose version

.env files:

Ensure all services have properly configured .env files (e.g., DB URLs, JWT secrets, API keys, etc.)

## 🚀 Running the Project (Recommended Way)

docker compose up --build -d

## 🔁 GitHub Actions (CI/CD)
To enable CI/CD deployment via GitHub Actions:

Go to your GitHub repository → Settings → Secrets and Variables → Actions → New Repository Secret.

Add the following secrets:

DOCKER_USERNAME: Your Docker Hub username

DOCKER_PASSWORD: Your Docker Hub password or access token

# 🎨 Frontend – React UI

## 🛠 Tech Stack

React.js – Component-based UI

React Router – Client-side routing

Context API – Global state management

Custom Hooks – Reusable logic (useForm, useScrollDisable, useOutsideClose, etc.)

Toastify – User-friendly toast notifications

TailwindCSS / SCSS – Styling and layout

## 🧩 Key Features

Feature	Description
Responsive UI	Modern, minimal UI that adapts across screen sizes
Account Modal	Login/Signup modal with toggling and form validation
Product Showcase	Displays featured products, discounts, and category-based listings
Auth Integration	Uses JWT for authentication, form data is sent via fetch API
Form Validation	Custom validation for login and signup forms
Social Login UI	UI support for Facebook, Google, Twitter login buttons (OAuth not wired)

