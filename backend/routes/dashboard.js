const r = require('express').Router(), Issue = require('../models/Issue'), { auth } = require('../middleware/auth');
r.get('/', auth, async (req, res, next) => {
  try {
    const g = await Issue.aggregate([{ $group: { _id: '$status', c: { $sum: 1 } } }]);
    const byStatus = { Open: 0, 'In Progress': 0, Closed: 0 };
    g.forEach(x => { byStatus[x._id] = x.c; });
    res.json({
      total: Object.values(byStatus).reduce((a, b) => a + b, 0), byStatus,
      assignedToMe: await Issue.countDocuments({ assignedTo: req.user._id }),
      unassigned: await Issue.countDocuments({ assignedTo: null })
    });
  } catch (e) { next(e); }
});
module.exports = r;
