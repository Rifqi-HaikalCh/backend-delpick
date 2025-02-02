const { firebaseDB } = require('../config/firebase');
const admin = require('firebase-admin');

class ProductService {
  async getAllProducts() {
    try {
      const productsSnapshot = await firebaseDB.collections.products.get();
      const products = productsSnapshot.docs.map(doc => ({
        product_id: doc.id,
        ...doc.data()
      }));
      return products;
    } catch (error) {
      throw new Error('Error fetching products: ' + error.message);
    }
  }

  async createProduct(productData, storeId) {
    try {
      const productId = Date.now().toString();
      
      const newProduct = {
        product_id: productId,
        store_id: storeId,
        name: productData.name,
        description: productData.description,
        price: productData.price,
        category: productData.category,
        stock: productData.stock,
        is_available: true,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      };

      await firebaseDB.collections.products.doc(productId).set(newProduct);
      return newProduct;
    } catch (error) {
      throw new Error('Error creating product: ' + error.message);
    }
  }

  async updateProduct(productId, productData, storeId) {
    try {
      const productDoc = await firebaseDB.collections.products.doc(productId).get();
      
      if (!productDoc.exists) {
        throw new Error('Product not found');
      }
      
      const productDetails = productDoc.data();
      if (productDetails.store_id !== storeId) {
        throw new Error('Unauthorized to update this product');
      }

      const updateData = {
        ...productData,
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      };

      await firebaseDB.collections.products.doc(productId).update(updateData);
      return { product_id: productId, ...updateData };
    } catch (error) {
      throw new Error('Error updating product: ' + error.message);
    }
  }

  async deleteProduct(productId, storeId) {
    try {
      const productDoc = await firebaseDB.collections.products.doc(productId).get();
      
      if (!productDoc.exists) {
        throw new Error('Product not found');
      }
      
      const productDetails = productDoc.data();
      if (productDetails.store_id !== storeId) {
        throw new Error('Unauthorized to delete this product');
      }

      await firebaseDB.collections.products.doc(productId).delete();
      return { message: 'Product successfully deleted' };
    } catch (error) {
      throw new Error('Error deleting product: ' + error.message);
    }
  }
}

module.exports = new ProductService();