
const Material = require('../models/Material');

const uploadMaterial = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const newMaterial = new Material({
            title: req.body.title,
            description: req.body.description,
            filePath: req.file.path,
            uploadedBy: req.user._id, // Got from verifyToken
            visibleToRoles: req.body.visibleToRoles ? JSON.parse(req.body.visibleToRoles) : []
        });

        await newMaterial.save();
        res.status(201).json(newMaterial);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getMaterials = async (req, res) => {
    try {
        // Optional: Filter by role visibility here
        let query = {};

        // If not super admin or manager/trainer, enforce visibility
        const isStaff = req.user.isSuperAdmin || req.user.roles.some(r => r.permissions?.canManageUsers || r.name === 'MANAGER' || r.name.includes('TRAINER'));

        if (!isStaff) {
            // User must have a role that matches one of the visibleToRoles OR visibleToRoles is []
            // This is tricky in simple query. Easier to fetch and filter if dataset small, or complex query:
            // $or: [{ visibleToRoles: { $size: 0 } }, { visibleToRoles: { $in: req.user.roles.map(r => r._id) } }]
            const userRoleIds = req.user.roles.map(r => r._id);
            query = {
                $or: [
                    { visibleToRoles: { $size: 0 } }, // Public
                    { visibleToRoles: { $in: userRoleIds } } // Targeted
                ]
            };
        }

        const materials = await Material.find(query).populate('uploadedBy', 'username');
        res.json(materials);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { uploadMaterial, getMaterials };
