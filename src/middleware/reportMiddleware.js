const validateReportData = (req, res, next) => {
    const { reported_type, reported_id, description } = req.body;
  
    if (!reported_type || !reported_id || !description) {
      return res.status(400).json({
        success: false,
        message: 'reported_type, reported_id, and description are required'
      });
    }
  
    const validReportedTypes = ['customer', 'driver', 'store', 'order'];
    if (!validReportedTypes.includes(reported_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reported_type'
      });
    }
  
    if (description.length < 10 || description.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Description must be between 10 and 1000 characters'
      });
    }
  
    next();
  };
  
  const validateReportUpdate = (req, res, next) => {
    const { status, description } = req.body;
  
    if (status) {
      const validStatuses = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid report status'
        });
      }
    }
  
    if (description) {
      if (description.length < 10 || description.length > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Description must be between 10 and 1000 characters'
        });
      }
    }
  
    next();
  };
  
  const canCreateReport = (req, res, next) => {
    const allowedRoles = ['customer', 'driver', 'store'];
    
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to create reports'
      });
    }
  
    next();
  };
  
  module.exports = {
    validateReportData,
    validateReportUpdate,
    canCreateReport
  };