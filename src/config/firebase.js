const admin = require('firebase-admin');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');


dotenv.config();

console.log('Firebase Project ID:',process.env.FIREBASE_PROJECT_ID);

const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
  });
}

const db = admin.firestore();
const storage = admin.storage();

const collections = {
  users: db.collection('users'),
  admins: db.collection('admins'),
  customers: db.collection('customers'),
  drivers: db.collection('drivers'),
  stores: db.collection('stores'),
  products: db.collection('products'),
  orders: db.collection('orders'),
  orderItems: db.collection('orderItems'),
  reports: db.collection('reports'),
  deliveryTracking: db.collection('deliveryTracking'),
  driverRatings: db.collection('driverRatings'),
  storeRatings: db.collection('storeRatings')
};

const firebaseDB = {
  collections,
  admin,
  db,

  async createUser(userData) {
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      const userRecord = await admin.auth().createUser({
        uid: userData.user_id,
        email: userData.email,
        password: userData.password,
        displayName: userData.username,
        phoneNumber: userData.phone_number
      });
      await collections.users.doc(userData.user_id).set({
        user_id: userData.user_id,
        username: userData.username,
        email: userData.email,
        password: userData.password, 
        phone_number: userData.phone_number,
        role: userData.role,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      });
      return userRecord;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  },

  async createStore(storeData) {
    const storeRef = collections.stores.doc(storeData.store_id.toString());
    await storeRef.set({
      user_id: storeData.user_id,
      store_name: storeData.store_name,
      description: storeData.description,
      address: storeData.address,
      phone: storeData.phone,
      operation_hours: storeData.operation_hours,
      rating: storeData.rating,
      is_active: storeData.is_active
    });
  },

  async createDriverRating(driverId, rating, orderId) {
    try {
      const ratingDoc = await collections.driverRatings.doc(driverId).get();
      let ratingData = { ratings: [], totalRatings: 0, averageRating: 0 };

      if (ratingDoc.exists) {
        ratingData = ratingDoc.data();
      }

      ratingData.ratings.push({ orderId, rating });
      ratingData.totalRatings = ratingData.ratings.length;
      ratingData.averageRating = ratingData.ratings.reduce((sum, r) => sum + r.rating, 0) / ratingData.totalRatings;

      await collections.driverRatings.doc(driverId).set(ratingData);
      await this.updateDriverRating(driverId, ratingData.averageRating);
    } catch (error) {
      console.error("Error creating driver rating:", error);
      throw error;
    }
  },

  async createStoreRating(storeId, rating, orderId) {
    try {
      const ratingDoc = await collections.storeRatings.doc(storeId).get();
      let ratingData = { ratings: [], totalRatings: 0, averageRating: 0 };

      if (ratingDoc.exists) {
        ratingData = ratingDoc.data();
      }

      ratingData.ratings.push({ orderId, rating });
      ratingData.totalRatings = ratingData.ratings.length;
      ratingData.averageRating = ratingData.ratings.reduce((sum, r) => sum + r.rating, 0) / ratingData.totalRatings;

      await collections.storeRatings.doc(storeId).set(ratingData);
      await this.updateStoreRating(storeId, ratingData.averageRating);
    } catch (error) {
      console.error("Error creating store rating:", error);
      throw error;
    }
  },

  async getDriverRating(driverId) {
    try {
      const ratingDoc = await collections.driverRatings.doc(driverId).get();
      if (ratingDoc.exists) {
        return ratingDoc.data();
      } else {
        return { ratings: [], totalRatings: 0, averageRating: 0 };
      }
    } catch (error) {
      console.error("Error getting driver rating:", error);
      throw error;
    }
  },

  async getStoreRating(storeId) {
    try {
      const ratingDoc = await collections.storeRatings.doc(storeId).get();
      if (ratingDoc.exists) {
        return ratingDoc.data();
      } else {
        return { ratings: [], totalRatings: 0, averageRating: 0 };
      }
    } catch (error) {
      console.error("Error getting store rating:", error);
      throw error;
    }
  },

  async updateStoreRating(storeId, averageRating) {
    try {
      await collections.stores.doc(storeId).update({
        rating: averageRating
      });
    } catch (error) {
      console.error("Error updating store rating:", error);
      throw error;
    }
  },

  async updateDriverRating(driverId, averageRating) {
    try {
      await collections.drivers.doc(driverId).update({
        rating: averageRating
      });
    } catch (error) {
      console.error("Error updating driver rating:", error);
      throw error;
    }
  },

  async createProduct(productData) {
    const productRef = collections.products.doc(productData.product_id.toString());
    await productRef.set({
      store_id: productData.store_id,
      name: productData.name,
      description: productData.description,
      price: productData.price,
      category: productData.category,
      stock: productData.stock,
      is_available: productData.is_available
    });
  },

  async createOrder(orderData) {
    const orderRef = collections.orders.doc(orderData.order_id.toString());
    await orderRef.set({
      customer_id: orderData.customer_id,
      store_id: orderData.store_id,
      driver_id: orderData.driver_id,
      total_amount: orderData.total_amount,
      status: orderData.status,
      order_time: admin.firestore.FieldValue.serverTimestamp()
    });
  },

  async createOrderItem(orderItemData) {
    const orderItemRef = collections.orderItems.doc();
    await orderItemRef.set({
      order_id: orderItemData.order_id,
      product_id: orderItemData.product_id,
      quantity: orderItemData.quantity,
      price: orderItemData.price
    });
  },

  async updateDeliveryTracking(trackingData) {
    const trackingRef = collections.deliveryTracking.doc(trackingData.tracking_id.toString());
    await trackingRef.set({
      order_id: trackingData.order_id,
      status: trackingData.status,
      current_latitude: trackingData.current_latitude,
      current_longitude: trackingData.current_longitude,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
  },

  async createReport(reportData) {
    try {
      const reportId = Date.now().toString();
      const newReport = {
        report_id: reportId,
        reporter_id: reportData.reporter_id,
        reporter_email: reportData.reporter_email,
        reporter_phone: reportData.reporter_phone,
        reported_type: reportData.reported_type,
        reported_id: reportData.reported_id,
        description: reportData.description,
        status: 'PENDING',
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      };
      await collections.reports.doc(reportId).set(newReport);
      return newReport;
    } catch (error) {
      console.error("Error creating report:", error);
      throw error;
    }
  },

  async getUser(userId) {
    const userDoc = await collections.users.doc(userId.toString()).get();
    return userDoc.exists ? userDoc.data() : null;
  },

  async getStore(storeId) {
    const storeDoc = await collections.stores.doc(storeId.toString()).get();
    return storeDoc.exists ? storeDoc.data() : null;
  },

  async getOrder(orderId) {
    const orderDoc = await collections.orders.doc(orderId.toString()).get();
    return orderDoc.exists ? orderDoc.data() : null;
  },


  async getAllUsers() {
  try {
    const usersSnapshot = await collections.users.get();
    const usersList = usersSnapshot.docs.map(doc => {
      return {
        userId: doc.id,  // This is the document ID, which is considered the userId
        ...doc.data()     // This will spread the remaining fields from the Firestore document
      };
    });
    return usersList;
  } catch (error) {
    console.error("Error getting all users:", error);
    throw error;
  }
},


async login(req, res) {
  const { email, password } = req.body;

  console.log('Entered email:', email);
  console.log('Entered password:', password);
  try {
    const userSnapshot = await firebaseDB.collections.users.where('email', '==', email).limit(1).get();

    if (userSnapshot.empty) {
      console.log('User not found');
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userDoc = userSnapshot.docs[0].data();
    console.log('User found:', userDoc);

    try {
      const passwordMatch = await bcrypt.compare(password, userDoc.password);
      console.log('Password entered by user:', password);
      console.log('Password match result:', passwordMatch);

      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      const token = jwt.sign(
        { userId: userDoc.user_id, role: userDoc.role, email: userDoc.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        data: {
          userId: userDoc.user_id,
          username: userDoc.username,
          email: userDoc.email,
          role: userDoc.role
        }
      });

    } catch (error) {
      console.error('Error comparing password:', error);
      return res.status(500).json({
        success: false,
        message: 'Error comparing password',
        error: error.message
      });
    }

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
},

async updateReport(reportId, updateData) {
  try {
    await collections.reports.doc(reportId).update({
      ...updateData,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
    return { report_id: reportId, ...updateData };
  } catch (error) {
    console.error("Error updating report:", error);
    throw error;
  }
},

async getReportById(reportId, userId, role) {
  try {
    const reportDoc = await collections.reports.doc(reportId).get();
    
    if (!reportDoc.exists) {
      throw new Error('Report not found');
    }

    const reportData = reportDoc.data();

    if (role !== 'admin') {
      if (reportData.reporter_id !== userId) {
        throw new Error('Unauthorized to view this report');
      }
    }

    return reportData;
  } catch (error) {
    console.error("Error getting report:", error);
    throw error;
  }
},

async getAllReports(userId, role) {
  try {
    let reportsQuery = collections.reports;

    if (role === 'admin') {
      const reportsSnapshot = await reportsQuery.get();
      return reportsSnapshot.docs.map(doc => ({
        report_id: doc.id,
        ...doc.data()
      }));
    } else {
      reportsQuery = reportsQuery.where('reporter_id', '==', userId);
      const reportsSnapshot = await reportsQuery.get();
      return reportsSnapshot.docs.map(doc => ({
        report_id: doc.id,
        ...doc.data()
      }));
    }
  } catch (error) {
    console.error("Error getting reports:", error);
    throw error;
  }
},

};

module.exports = {
  admin,
  db,
  firebaseDB, 
  storage,
  };