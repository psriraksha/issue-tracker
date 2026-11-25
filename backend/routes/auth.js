const r = require('express').Router(), bcrypt = require('bcryptjs'), jwt = require('jsonwebtoken');
const User = require('../models/User'), { auth } = require('../middleware/auth');
const sign = u => jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const out = u => ({ id: u._id, name: u.name, email: u.email, role: u.role });

r.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password || password.length < 6)
      return res.status(400).json({ message: 'Name, email and password (min 6 chars) are required' });
    if (await User.findOne({ email: email.toLowerCase() })) return res.status(409).json({ message: 'Email already registered' });
    const u = await User.create({ name, email, password: await bcrypt.hash(password, 10) });
    res.status(201).json({ token: sign(u), user: out(u) });
  } catch (e) { next(e); }
});

// admin = true  -> only admin accounts may log in
// admin = false -> only normal users may log in
const login = admin => async (req, res, next) => {
  try {
    const u = await User.findOne({ email: (req.body.email || '').toLowerCase() });
    if (!u || !(await bcrypt.compare(req.body.password || '', u.password))) return res.status(401).json({ message: 'Invalid credentials' });
    if (admin && u.role !== 'admin') return res.status(403).json({ message: 'Not an admin account' });
    if (!admin && u.role === 'admin') return res.status(403).json({ message: 'Admins must use the Admin login' });
    res.json({ token: sign(u), user: out(u) });
  } catch (e) { next(e); }
};
r.post('/login', login(false));
r.post('/admin-login', login(true));
r.get('/me', auth, (req, res) => res.json(out(req.user)));
module.exports = r;