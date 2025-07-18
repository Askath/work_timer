/**
 * @fileoverview Error handling middleware for Express.js
 * @author Work Timer Application
 */

const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Default error response
  let status = 500;
  let message = 'Internal server error';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    status = 400;
    message = 'Validation error: ' + err.message;
  } else if (err.name === 'NotFoundError') {
    status = 404;
    message = err.message;
  } else if (err.code === 'ENOENT') {
    status = 404;
    message = 'File not found';
  } else if (err.code === 'EACCES') {
    status = 500;
    message = 'Permission denied accessing file system';
  } else if (err.code === 'ENOSPC') {
    status = 500;
    message = 'Insufficient disk space';
  } else if (err.message) {
    message = err.message;
  }

  res.status(status).json({
    error: message,
    timestamp: new Date().toISOString(),
    path: req.path
  });
};

module.exports = errorHandler;