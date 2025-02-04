const express = require('express');
const router = express.Router();
const ReportService = require('../services/reportService');
const { authenticateToken } = require('../middleware/authMiddleware');
const { validateReportData, validateReportUpdate, canCreateReport } = require('../middleware/reportMiddleware');
const { checkAdmin } = require('../middleware/authMiddleware');

router.post('/add', 
  authenticateToken, 
  canCreateReport,
  validateReportData, 
  async (req, res) => {
    try {
      const report = await ReportService.createReport(
        req.body, 
        req.user.userId, 
        req.user.role
      );
      res.status(201).json({
        success: true,
        data: report
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
});

router.put('/:reportId', 
  authenticateToken,
  validateReportUpdate,
  async (req, res) => {
    try {
      const report = await ReportService.updateReport(
        req.params.reportId, 
        req.body, 
        req.user.userId, 
        req.user.role
      );
      res.status(200).json({
        success: true,
        data: report
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
});

router.get('/:reportId', 
  authenticateToken, 
  async (req, res) => {
    try {
      const report = await ReportService.getReportById(
        req.params.reportId, 
        req.user.userId, 
        req.user.role
      );
      res.status(200).json({
        success: true,
        data: report
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
});

router.get('/all', 
  authenticateToken, 
  async (req, res) => {
    try {
      const reports = await ReportService.getAllReports(
        req.user.userId, 
        req.user.role
      );
      res.status(200).json({
        success: true,
        data: reports
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
});

router.patch('/:reportId/status', 
  authenticateToken,
  checkAdmin,
  validateReportUpdate,
  async (req, res) => {
    try {
      const report = await ReportService.updateReport(
        req.params.reportId, 
        { status: req.body.status }, 
        req.user.userId, 
        req.user.role
      );
      res.status(200).json({
        success: true,
        data: report
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
});

module.exports = router;