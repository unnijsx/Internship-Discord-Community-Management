
const Task = require('../models/Task');
const AuditLog = require('../models/AuditLog');

// Get all tasks
exports.getTasks = async (req, res) => {
    try {
        const tasks = await Task.find().populate('assignee', 'username email avatar').populate('assignedBy', 'username');
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Create Task
exports.createTask = async (req, res) => {
    const { title, description, assignee, priority, dueDate } = req.body;
    try {
        const newTask = new Task({
            title,
            description,
            assignee,
            assignedBy: req.user._id, // Assumes auth middleware
            priority,
            dueDate
        });
        await newTask.save();

        await AuditLog.create({
            action: 'CREATE_TASK',
            performedBy: req.user._id,
            details: `Created task: ${title}`
        });

        res.status(201).json(newTask);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Update Task Status/Details
exports.updateTask = async (req, res) => {
    const { id } = req.params;
    try {
        const task = await Task.findByIdAndUpdate(id, req.body, { new: true });

        // Log status change if present
        if (req.body.status) {
            await AuditLog.create({
                action: 'UPDATE_TASK_STATUS',
                performedBy: req.user._id,
                details: `Updated task ${task.title} status to ${req.body.status}`
            });
        }

        res.json(task);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Delete Task
exports.deleteTask = async (req, res) => {
    try {
        await Task.findByIdAndDelete(req.params.id);
        res.json({ message: 'Task deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
