require('dotenv').config();
const express = require('express'), cors = require('cors'), mongoose = require('mongoose'), bcrypt = require('bcryptjs');
const User = require('./models/User');
const app = express();
app.use(cors({ origin: (process.env.CLIENT_URL || '*').split(',') }));
app.use(express.json());
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/issues', require('./routes/issues'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use((e, req, res, next) => {
  const bad = ['ValidationError', 'CastError'].includes(e.name);
  res.status(bad ? 400 : e.status || 500).json({ message: bad ? 'Invalid data: ' + e.message : e.message || 'Server error' });
});
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const e = process.env.ADMIN_EMAIL, p = process.env.ADMIN_PASSWORD;
  if (e && p && !(await User.findOne({ email: e.toLowerCase() })))
    await User.create({ name: 'Admin', email: e, password: await bcrypt.hash(p, 10), role: 'admin' });
  app.listen(process.env.PORT || 5000, () => console.log('API running'));
}).catch(err => { console.error('DB connection failed', err.message); process.exit(1); });
