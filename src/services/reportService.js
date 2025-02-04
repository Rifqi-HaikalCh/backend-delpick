const { firebaseDB } = require('../config/firebase');
const admin = require('firebase-admin');

class ReportService {
  async createReport(reportData, reporterId, role) {
    try {
      const reporterDoc = await firebaseDB.collections.users.doc(reporterId).get();
      if (!reporterDoc.exists) {
        throw new Error('Reporter not found');
      }
      const reporterData = reporterDoc.data();

      switch (reportData.reported_type) {
        case 'customer':
        case 'driver':
        case 'store':
          const entityDoc = await firebaseDB.collections[`${reportData.reported_type}s`]
            .doc(reportData.reported_id)
            .get();
          if (!entityDoc.exists) {
            throw new Error(`${reportData.reported_type} not found`);
          }
          break;
        case 'order':
          const orderDoc = await firebaseDB.collections.orders
            .doc(reportData.reported_id)
            .get();
          if (!orderDoc.exists) {
            throw new Error('Order not found');
          }
          break;
        default:
          throw new Error('Invalid reported type');
      }

      const newReportData = {
        reporter_id: reporterId,
        reporter_email: reporterData.email,
        reporter_phone: reporterData.phone_number,
        ...reportData
      };

      return await firebaseDB.createReport(newReportData);
    } catch (error) {
      throw new Error('Error creating report: ' + error.message);
    }
  }

  async updateReport(reportId, updateData, userId, role) {
    try {
      const reportDoc = await firebaseDB.collections.reports.doc(reportId).get();
      
      if (!reportDoc.exists) {
        throw new Error('Report not found');
      }

      const reportDetails = reportDoc.data();

      if (role === 'admin') {
        if (updateData.status) {
          const validStatuses = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
          if (!validStatuses.includes(updateData.status)) {
            throw new Error('Invalid report status');
          }
        }
      } else {
        if (reportDetails.reporter_id !== userId) {
          throw new Error('Unauthorized to update this report');
        }
        updateData = { description: updateData.description };
      }

      return await firebaseDB.updateReport(reportId, updateData);
    } catch (error) {
      throw new Error('Error updating report: ' + error.message);
    }
  }

  async getReportById(reportId, userId, role) {
    return await firebaseDB.getReportById(reportId, userId, role);
  }

  async getAllReports(userId, role) {
    return await firebaseDB.getAllReports(userId, role);
  }
}

module.exports = new ReportService();