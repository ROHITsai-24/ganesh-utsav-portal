# Admin Dashboard Setup Guide

## 🎯 **Admin Dashboard Features:**

### **📊 Dashboard Overview:**
- **Total Users** - Count of all registered users
- **Total Games** - Number of games played
- **Total Score** - Sum of all scores
- **Average Score** - Average score per game

### **👥 User Management:**
- **View all users** with their details
- **Delete users** (with confirmation)
- **See user registration dates**
- **Monitor user activity**

### **🎮 Game Score Management:**
- **View all game scores** and attempts
- **Delete individual scores** (with confirmation)
- **Track idol guesses** and results
- **Monitor game performance**

## 🔧 **Setup Instructions:**

### **Step 1: Create Admin Account**
1. **Go to your app:** http://localhost:3000
2. **Sign up** with an email containing "admin" (e.g., `admin@example.com`)
3. **Or use the demo credentials:**
   - Email: `admin@example.com`
   - Password: `password123`

### **Step 2: Access Admin Dashboard**
1. **Login** with admin credentials
2. **Click "Admin Dashboard"** button (appears for admin users)
3. **Or go directly to:** http://localhost:3000/admin

### **Step 3: Admin Authentication**
The system automatically detects admin users by:
- Email contains "admin"
- Or specific email: `admin@example.com`

## 🛡️ **Security Features:**

### **Admin Access Control:**
- ✅ **Email-based admin detection**
- ✅ **Secure authentication required**
- ✅ **Session management**
- ✅ **Logout functionality**

### **Data Protection:**
- ✅ **Confirmation dialogs** for deletions
- ✅ **Error handling** for failed operations
- ✅ **Real-time data refresh**

## 📱 **Admin Dashboard Features:**

### **Statistics Cards:**
- **Total Users:** Shows registered user count
- **Total Games:** Shows total games played
- **Total Score:** Shows sum of all scores
- **Average Score:** Shows average score per game

### **User Management:**
- **User List:** All registered users
- **User Details:** Email, username, join date
- **Delete Users:** Remove users with confirmation

### **Game Score Management:**
- **Score List:** All game attempts and scores
- **Score Details:** Idol name, user guess, score, date
- **Delete Scores:** Remove individual scores

### **Actions:**
- **Refresh Data:** Update dashboard data
- **Back to Game:** Return to main game
- **Logout Admin:** Sign out of admin panel

## 🚀 **Usage:**

### **For Monitoring:**
1. **View statistics** to understand game usage
2. **Monitor user activity** and engagement
3. **Track game performance** and scores

### **For Management:**
1. **Delete problematic users** if needed
2. **Remove invalid scores** if necessary
3. **Monitor system health** and usage

## 🔍 **Access Control:**

### **Admin Detection:**
```javascript
// Admin users are detected by:
const isAdmin = email.includes('admin') || email === 'admin@example.com'
```

### **Customization:**
You can modify the admin detection logic in:
- `src/app/admin/page.js`
- `src/components/admin/AdminAuth.jsx`

## 📊 **Data Privacy:**

- **Admin can view all user data**
- **Admin can delete users and scores**
- **Confirmation required** for destructive actions
- **Audit trail** through console logs

## 🎯 **Next Steps:**

1. **Create admin account** with admin email
2. **Access dashboard** at `/admin`
3. **Monitor game activity** and user engagement
4. **Manage users and scores** as needed

The admin dashboard is now ready to use! 🚀 