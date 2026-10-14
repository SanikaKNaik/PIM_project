export const errorHandler = (err, req, res, _next) => {
  console.error('[API Error Details]:', err);
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    error: message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  });
};
