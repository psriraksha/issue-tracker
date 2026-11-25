const jwt = require('jsonwebtoken'), User = require('../models/User');
exports.auth = async (req, res, next) => {
  try {
    const t = (req.headers.authorization || '').replace('Bearer ', '');
    const { id } = jwt.verify(t, process.env.JWT_SECRET);
    const u = await User.findById(id).select('-password');
    if (!u) throw new Error('no user');
    req.user = u; next();
  } catch { res.status(401).json({ message: 'Unauthorized' }); }
};
exports.adminOnly = (req, res, next) => req.user.role === 'admin' ? next() : res.status(403).json({ message: 'Admin only' });
