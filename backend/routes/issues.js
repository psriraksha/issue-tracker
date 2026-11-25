const r = require('express').Router(), Issue = require('../models/Issue'), User = require('../models/User'), { auth } = require('../middleware/auth');
r.use(auth);
const base = q => q.populate('createdBy', 'name email').populate('assignedTo', 'name email');
const full = q => base(q).populate('comments.author', 'name');
const id = x => String((x && x._id) || x);

// Who can see which issues:
// admin -> every issue; user -> only issues they filed or that are assigned to them
const scope = u => u.role === 'admin' ? {} : { $or: [{ createdBy: u._id }, { assignedTo: u._id }] };
const mineOnly = req => ({ _id: req.params.id, ...scope(req.user) });

// An issue can only be given to a registered (non-admin) user, or left unassigned
const validAssignee = async v => !v || !!(await User.findOne({ _id: v, role: 'user' }));

r.get('/', async (req, res, next) => {
  try {
    const { status, search, mine } = req.query, f = { ...scope(req.user) };
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
    if (!(await validAssignee(assignedTo))) return res.status(400).json({ message: 'Issues can only be assigned to registered users' });
    const i = await Issue.create({ title, description, priority, assignedTo: assignedTo || null, createdBy: req.user._id });
    res.status(201).json(await full(Issue.findById(i._id)));
  } catch (e) { next(e); }
});

r.get('/:id', async (req, res, next) => {
  try {
    const i = await full(Issue.findOne(mineOnly(req)));
    i ? res.json(i) : res.status(404).json({ message: 'Issue not found' });
  } catch (e) { next(e); }
});

r.put('/:id', async (req, res, next) => {
  try {
    const i = await Issue.findOne(mineOnly(req));
    if (!i) return res.status(404).json({ message: 'Issue not found' });
    const admin = req.user.role === 'admin', owner = id(i.createdBy) === id(req.user._id);
    if (!(admin || owner)) return res.status(403).json({ message: 'Not allowed to edit this issue' });
    if (!admin && req.body.status !== undefined)
      return res.status(403).json({ message: 'Only admin can change the status' });
    const fields = admin ? ['title', 'description', 'priority', 'status'] : ['title', 'description', 'priority'];
    fields.forEach(k => { if (req.body[k] !== undefined) i[k] = req.body[k]; });
    if (req.body.assignedTo !== undefined) {
      if (!(await validAssignee(req.body.assignedTo)))
        return res.status(400).json({ message: 'Issues can only be assigned to registered users' });
      i.assignedTo = req.body.assignedTo || null;
    }
    await i.save();
    res.json(await full(Issue.findById(i._id)));
  } catch (e) { next(e); }
});

r.delete('/:id', async (req, res, next) => {
  try {
    const i = await Issue.findOne(mineOnly(req));
    if (!i) return res.status(404).json({ message: 'Issue not found' });
    if (!(req.user.role === 'admin' || id(i.createdBy) === id(req.user._id))) return res.status(403).json({ message: 'Not allowed to delete this issue' });
    await i.deleteOne();
    res.json({ message: 'Issue deleted' });
  } catch (e) { next(e); }
});

r.post('/:id/comments', async (req, res, next) => {
  try {
    if (!req.body.text || !req.body.text.trim()) return res.status(400).json({ message: 'Comment text is required' });
    const i = await Issue.findOne(mineOnly(req));
    if (!i) return res.status(404).json({ message: 'Issue not found' });
    i.comments.push({ text: req.body.text, author: req.user._id });
    await i.save();
    res.status(201).json(await full(Issue.findById(i._id)));
  } catch (e) { next(e); }
});
module.exports = r;