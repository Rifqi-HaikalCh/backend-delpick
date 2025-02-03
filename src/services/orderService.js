const { firebaseDB } = require('../config/firebase');
const admin = require('firebase-admin');

class OrderService {
  async createOrder(orderData, customerId) {
    try {
      console.log('Customer ID received:', customerId);
      
      if (!customerId) {
        throw new Error('Customer ID is required');
      }

      if (!orderData.store_id) {
        throw new Error('Store ID is required');
      }

      if (!orderData.orderItems || !Array.isArray(orderData.orderItems) || orderData.orderItems.length === 0) {
        throw new Error('Order items are required and must be a non-empty array');
      }

      const orderId = Date.now().toString();
      const orderItems = orderData.orderItems;

      let totalAmount = 0;
      for (const item of orderItems) {
        const productDoc = await firebaseDB.collections.products.doc(item.product_id).get();
        if (!productDoc.exists) {
          throw new Error(`Product ${item.product_id} not found`);
        }
        const product = productDoc.data();
        
        if (!product.price) {
          throw new Error(`Price not found for product ${item.product_id}`);
        }
        
        if (!item.quantity || item.quantity <= 0) {
          throw new Error('Quantity must be greater than 0');
        }
        
        totalAmount += product.price * item.quantity;
      }

      const newOrder = {
        order_id: orderId,
        customer_id: customerId,
        store_id: orderData.store_id,
        driver_id: null,
        total_amount: totalAmount,
        status: 'PENDING',
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      };

      console.log('Order data to be saved:', newOrder);

      await firebaseDB.collections.orders.doc(orderId).set(newOrder);

      const orderItemPromises = orderItems.map(async (item) => {
        const productDoc = await firebaseDB.collections.products.doc(item.product_id).get();
        const product = productDoc.data();
        
        const orderItem = {
          order_id: orderId,
          product_id: item.product_id,
          quantity: item.quantity,
          price: product.price,
          subtotal: product.price * item.quantity,
          created_at: admin.firestore.FieldValue.serverTimestamp()
        };

        await firebaseDB.collections.orderItems.doc().set(orderItem);
        return orderItem;
      });

      const savedOrderItems = await Promise.all(orderItemPromises);

      return { ...newOrder, orderItems: savedOrderItems };
    } catch (error) {
      console.error('Error in createOrder:', error);
      throw new Error('Error creating order: ' + error.message);
    }
  }

  async updateOrder(orderId, updateData, customerId) {
    try {
      const orderDoc = await firebaseDB.collections.orders.doc(orderId).get();
      
      if (!orderDoc.exists) {
        throw new Error('Order not found');
      }

      const orderDetails = orderDoc.data();
      if (orderDetails.customer_id !== customerId) {
        throw new Error('Unauthorized to update this order');
      }

      if (orderDetails.status !== 'PENDING') {
        throw new Error('Can only update pending orders');
      }

      if (updateData.orderItems) {
        let totalAmount = 0;
        for (const item of updateData.orderItems) {
          const productDoc = await firebaseDB.collections.products.doc(item.product_id).get();
          const product = productDoc.data();
          totalAmount += product.price * item.quantity;
        }
        updateData.total_amount = totalAmount;

        const orderItemsSnapshot = await firebaseDB.collections.orderItems
          .where('order_id', '==', orderId)
          .get();
        
        const batch = firebaseDB.db.batch();
        orderItemsSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();

        for (const item of updateData.orderItems) {
          const productDoc = await firebaseDB.collections.products.doc(item.product_id).get();
          const product = productDoc.data();
          
          await firebaseDB.collections.orderItems.doc().set({
            order_id: orderId,
            product_id: item.product_id,
            quantity: item.quantity,
            price: product.price,
            subtotal: product.price * item.quantity,
            updated_at: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      }

      updateData.updated_at = admin.firestore.FieldValue.serverTimestamp();
      await firebaseDB.collections.orders.doc(orderId).update(updateData);

      return { order_id: orderId, ...updateData };
    } catch (error) {
      throw new Error('Error updating order: ' + error.message);
    }
  }

  async deleteOrder(orderId, customerId) {
    try {
      const orderDoc = await firebaseDB.collections.orders.doc(orderId).get();
      
      if (!orderDoc.exists) {
        throw new Error('Order not found');
      }

      const orderDetails = orderDoc.data();
      if (orderDetails.customer_id !== customerId) {
        throw new Error('Unauthorized to delete this order');
      }

      if (orderDetails.status !== 'PENDING') {
        throw new Error('Can only delete pending orders');
      }

      const orderItemsSnapshot = await firebaseDB.collections.orderItems
        .where('order_id', '==', orderId)
        .get();
      
      const batch = firebaseDB.db.batch();
      orderItemsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      await firebaseDB.collections.orders.doc(orderId).delete();

      return { message: 'Order successfully deleted' };
    } catch (error) {
      throw new Error('Error deleting order: ' + error.message);
    }
  }

  async getOrderById(orderId, userId, role) {
    try {
      const orderDoc = await firebaseDB.collections.orders.doc(orderId).get();
      
      if (!orderDoc.exists) {
        throw new Error('Order not found');
      }

      const orderData = orderDoc.data();

      if (role === 'customer' && orderData.customer_id !== userId) {
        throw new Error('Unauthorized to view this order');
      } else if (role === 'store' && orderData.store_id !== userId) {
        throw new Error('Unauthorized to view this order');
      } else if (role === 'driver' && orderData.driver_id !== userId) {
        throw new Error('Unauthorized to view this order');
      }

      const orderItemsSnapshot = await firebaseDB.collections.orderItems
        .where('order_id', '==', orderId)
        .get();

      const orderItems = orderItemsSnapshot.docs.map(doc => doc.data());

      return { ...orderData, orderItems };
    } catch (error) {
      throw new Error('Error fetching order: ' + error.message);
    }
  }

  async getAllOrders(userId, role) {
    try {
      let ordersQuery = firebaseDB.collections.orders;

      if (role === 'customer') {
        ordersQuery = ordersQuery.where('customer_id', '==', userId);
      } else if (role === 'store') {
        ordersQuery = ordersQuery.where('store_id', '==', userId);
      } else if (role === 'driver') {
        ordersQuery = ordersQuery.where('driver_id', '==', userId);
      }

      const ordersSnapshot = await ordersQuery.get();
      const orders = [];

      for (const doc of ordersSnapshot.docs) {
        const orderData = doc.data();
        
        const orderItemsSnapshot = await firebaseDB.collections.orderItems
          .where('order_id', '==', doc.id)
          .get();

        const orderItems = orderItemsSnapshot.docs.map(itemDoc => itemDoc.data());
        
        orders.push({
          ...orderData,
          orderItems
        });
      }

      return orders;
    } catch (error) {
      throw new Error('Error fetching orders: ' + error.message);
    }
  }
}

module.exports = new OrderService();