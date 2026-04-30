# 🌿 Farm2Home — Fresh From The Field

> 🚜 Connecting farmers directly to consumers with zero middlemen.

Farm2Home is a **multi-role web platform** that enables seamless interaction between **Farmers**, **Consumers**, and **Delivery Partners**. It promotes direct farm-to-table commerce, ensuring **fresh produce**, **fair pricing**, and **efficient local delivery**.

---

## Live Demo
*(deployed link here)*

---

## 📸 Preview

![Farm2Home UI](https://via.placeholder.com/1200x600?text=Farm2Home+Preview)

---

## ✨ Features

### 👨‍🌾 Farmer Dashboard
- Register/login with phone & password
- Add and manage products:
  - Price (₹/kg)
  - Stock quantity
  - Minimum bulk order
- View:
  - Active stock
  - Delivery/order status
- Auto-detect farm location 📍

---

### 🛍️ Consumer Dashboard
- Browse fresh produce by category:
  - 🥬 Vegetables
  - 🍎 Fruits
  - 🌸 Flowers
- Smart emoji-based product display 🍅🥭🌹
- Add items to cart & checkout
- Payment methods:
  - 💵 Cash on Delivery
  - 📱 UPI
- 📍 Live order tracking (simulated)

---

### 🧺 Community Basket (Group Buying)
- Start or join a shared basket
- Pool orders with neighbors
- Automatically triggers order when:
  
  `Total Pledged ≥ Minimum Required`

- Reduces delivery cost and meets bulk constraints

---

### 🛵 Driver Dashboard
- Register/login as delivery partner
- View:
  - Available delivery jobs
  - Accepted deliveries
- Accept jobs → Start delivery
- Simulated live tracking system
- Mark orders as delivered

---

## 🧠 How It Works

### 📦 Order Flow
1. Farmer lists produce  
2. Consumer places order / joins group buy  
3. Order stored in system  
4. Driver accepts delivery  
5. Tracking starts (simulated)  
6. Order delivered  

---

### 📍 Tracking Simulation
- Driver position updates every **2.5 seconds**
- Stored in `localStorage`
- Consumer UI updates in real-time

---

### 🧺 Group Buy Logic
- Users pledge quantity
- When target is reached:
  - Stock is reduced
  - Delivery job is created
  - Multi-drop route is generated

---

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|--------|
| HTML5 | Structure |
| CSS3 | UI & Animations |
| JavaScript (Vanilla) | Logic & State Management |
| localStorage | Mock Backend |
| Geolocation API | Location detection |
| OpenStreetMap API | Reverse geocoding |

---

