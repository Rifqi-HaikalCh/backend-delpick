const firebaseDB = require('../config/firebase').firebaseDB;

const getAllUsers = async () => {
  try {
    const usersSnapshot = await firebaseDB.collections.users.get();
    
    if (usersSnapshot.empty) {
      throw new Error('No users found.');
    }

    const users = usersSnapshot.docs.map(doc => {
      return {
        userId: doc.id,  // This is the document ID in Firestore, which is considered the user ID
        ...doc.data()     // Spread the remaining fields from the Firestore document
      };
    });

    return users;
  } catch (error) {
    throw new Error(error.message || 'Failed to retrieve users.');
  }
};


const deleteAllUsers = async () => {
  try {
    const usersSnapshot = await firebaseDB.collections.users.get();
    if (usersSnapshot.empty) {
      throw new Error('No users found to delete.');
    }
    const batch = firebaseDB.db.batch();
    usersSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    return { success: true, message: 'All users have been deleted successfully.' };
  } catch (error) {
    throw new Error(error.message);
  }
};

const deleteUserByEmail = async (email) => {
  try {
    const userSnapshot = await firebaseDB.collections.users.where('email', '==', email).limit(1).get();
    if (userSnapshot.empty) {
      throw new Error('User not found.');
    }
    const userDoc = userSnapshot.docs[0];  // Get the first user (assuming email is unique)
    await firebaseDB.collections.users.doc(userDoc.id).delete();
    return { success: true, message: 'User has been deleted successfully.' };
  } catch (error) {
    throw new Error(error.message || 'Failed to delete the user.');
  }
};

const updateUserData = async (userId, updatedData) => {
  try {
    // Get the user document from the Firestore collection by userId
    const userDoc = await firebaseDB.collections.users.doc(userId).get();

    if (!userDoc.exists) {
      throw new Error('User not found.');
    }

    // Update the user data with the new information
    await firebaseDB.collections.users.doc(userId).update(updatedData);

    return { success: true, message: 'User data updated successfully.' };
  } catch (error) {
    throw new Error(error.message || 'Failed to update user data.');
  }
};


module.exports = {
  getAllUsers,
  deleteAllUsers,
  deleteUserByEmail,
  updateUserData,
};
