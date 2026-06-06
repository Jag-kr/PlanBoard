/**
 * Global error-handling middleware.
 * Catches errors passed via next(err) throughout the application.
 */
const errorHandler = (err, req, res, next) => {
  console.error('[ErrorHandler]', err);

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const messages = err.errors ? err.errors.map((e) => e.message) : [err.message];
    return res.status(400).json({ error: messages.join(', ') });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }

  // Custom HTTP errors (attach statusCode to error object)
  if (err.statusCode) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Generic fallback
  const statusCode = err.status || 500;
  const message = statusCode === 500 ? 'Internal server error.' : err.message;
  return res.status(statusCode).json({ error: message });
};

module.exports = errorHandler;
