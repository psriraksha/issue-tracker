const r = require('express').Router(), Issue = require('../models/Issue'), User = require('../models/User'), { auth } = require('../middleware/auth');
r.use(auth);
const base = q => q.populate('createdBy', 'name email').populate('assignedTo', 'name email');
const full = q => base(q).populate('comments.author', 'name');
const id = x => String((x && x._id) || x);

r.get('/', async (req, res, next) => {
  try {
    const { status, search, mine } = req.query, f = {};
    if (status) f.status = status;
    if (search) f.title = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    if (mine === 'true') f.assignedTo = req.user._id;
    res.json(await base(Issue.find(f).select('-comments').sort('-createdAt')));
  } catch (e) { next(e); }
});
r.post('/', async (req, res, next) => {
  try {
    const { title, description, priority, assignedTo } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });
    const i = await Issue.create({ title, description, priority, assignedTo: req.user.role === 'admin' ? assignedTo || null : null, createdBy: req.user._id });
    res.status(201).json(await full(Issue.findById(i._id)));
  } catch (e) { next(e); }
});
r.get('/:id', async (req, res, next) => {
  try {
    const i = await full(Issue.findById(req.params.id));
    i ? res.json(i) : res.status(404).json({ message: 'Issue not found' });
  } catch (e) { next(e); }
});
r.put('/:id', async (req, res, next) => {
  try {
    const i = await Issue.findById(req.params.id);
    if (!i) return res.status(404).json({ message: 'Issue not found' });
    const admin = req.user.role === 'admin', owner = id(i.createdBy) === id(req.user._id);
    if (!(admin || owner)) return res.status(403).json({ message: 'Not allowed to edit this issue' });
    if (!admin && (req.body.status !== undefined || req.body.assignedTo !== undefined))
      return res.status(403).json({ message: 'Only admin can change status or assign issues' });
    const fields = admin ? ['title', 'description', 'priority', 'status'] : ['title', 'description', 'priority'];
    fields.forEach(k => { if (req.body[k] !== undefined) i[k] = req.body[k]; });
    if (admin && req.body.assignedTo !== undefined) {
      if (req.body.assignedTo && !(await User.findOne({ _id: req.body.assignedTo, role: 'user' })))
        return res.status(400).json({ message: 'Issues can only be assigned to registered users' });
      i.assignedTo = req.body.assignedTo || null;
    }
    await i.save();
    res.json(await full(Issue.findById(i._id)));
  } catch (e) { next(e); }
});
r.delete('/:id', async (req, res, next) => {
  try {
    const i = await Issue.findById(req.params.id);
    if (!i) return res.status(404).json({ message: 'Issue not found' });
    if (!(req.user.role === 'admin' || id(i.createdBy) === id(req.user._id))) return res.status(403).json({ message: 'Not allowed to delete this issue' });
    await i.deleteOne();
    res.json({ message: 'Issue deleted' });
  } catch (e) { next(e); }
});
r.post('/:id/comments', async (req, res, next) => {
  try {
    if (!req.body.text || !req.body.text.trim()) return res.status(400).json({ message: 'Comment text is required' });
    const i = await Issue.findById(req.params.id);
    if (!i) return res.status(404).json({ message: 'Issue not found' });
    i.comments.push({ text: req.body.text, author: req.user._id });
    await i.save();
    res.status(201).json(await full(Issue.findById(i._id)));
  } catch (e) { next(e); }
});
module.exports = r;
