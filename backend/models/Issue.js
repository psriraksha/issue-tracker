const m = require('mongoose');
const ref = { type: m.Schema.Types.ObjectId, ref: 'User' };
const comment = new m.Schema({ text: { type: String, required: true, trim: true }, author: ref }, { timestamps: true });
module.exports = m.model('Issue', new m.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  status: { type: String, enum: ['Open', 'In Progress', 'Closed'], default: 'Open' },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  createdBy: { ...ref, required: true },
  assignedTo: { ...ref, default: null },
  comments: [comment]
}, { timestamps: true }));
