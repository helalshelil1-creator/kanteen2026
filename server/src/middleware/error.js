export function errorHandler(err, _req, res, _next){
  console.error('❌ Error:', err.message);
  if(err.name === 'ZodError'){
    return res.status(400).json({ error: 'Validation error', details: err.errors });
  }
  if(err.code === 'P2002'){
    return res.status(409).json({ error: 'Duplicate entry', field: err.meta?.target });
  }
  if(err.code === 'P2025'){
    return res.status(404).json({ error: 'Not found' });
  }
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

export function notFound(_req, res){
  res.status(404).json({ error: 'Route not found' });
}