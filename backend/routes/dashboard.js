const r = require('express').Router(), Issue = require('../models/Issue'), { auth } = require('../middleware/auth');
r.get('/', auth, async (req, res, next) => {
  try {
    // admin counts every issue; a user counts only issues they filed or that are assigned to them
    const scope = req.user.role === 'admin' ? {} : { $or: [{ createdBy: req.user._id }, { assignedTo: req.user._id }] };
    const g = await Issue.aggregate([{ $match: scope }, { $group: { _id: '$status', c: { $sum: 1 } } }]);
    const byStatus = { Open: 0, 'In Progress': 0, Closed: 0 };
    g.forEach(x => { byStatus[x._id] = x.c; });
    res.json({
      total: Object.values(byStatus).reduce((a, b) => a + b, 0), byStatus,
      assignedToMe: await Issue.countDocuments({ ...scope, assignedTo: req.user._id }),
      unassigned: await Issue.countDocuments({ ...scope, assignedTo: null })
    });
  } catch (e) { next(e); }
});
module.exports = r;