const r = require('express').Router(), User = require('../models/User'), { auth } = require('../middleware/auth');

r.get('/', auth, async (req, res, next) => {
  try { res.json(await User.find({ role: 'user' }).select('name email role').sort('name')); } catch (e) { next(e); }
});
module.exports = r;
