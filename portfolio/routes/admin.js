const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Project = require('../models/Project');
const { auth, admin } = require('../middleware/auth');

const router = express.Router();

// @desc    Bütün istifadəçiləri əldə et
// @route   GET /api/admin/users
// @access  Private/Admin
router.get('/users', [auth, admin], async (req, res) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            users
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server xətası'
        });
    }
});

// @desc    Tək istifadəçini əldə et
// @route   GET /api/admin/users/:id
// @access  Private/Admin
router.get('/users/:id', [auth, admin], async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'İstifadəçi tapılmadı'
            });
        }
        
        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server xətası'
        });
    }
});

// @desc    İstifadəçini sil
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
router.delete('/users/:id', [auth, admin], async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'İstifadəçi tapılmadı'
            });
        }
        
        // Admin özünü silə bilməz
        if (user._id.toString() === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'Öz istifadəçinizi silə bilməzsiniz'
            });
        }
        
        await User.findByIdAndDelete(req.params.id);
        
        res.status(200).json({
            success: true,
            message: 'İstifadəçi uğurla silindi'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server xətası'
        });
    }
});

// @desc    İstifadəçi rolu dəyiş
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
router.put('/users/:id/role', [
    auth,
    admin,
    [
        body('role')
            .isIn(['user', 'admin'])
            .withMessage('Yalnız user və ya admin rolu mümkündür')
    ]
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Xəta',
                errors: errors.array()
            });
        }

        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'İstifadəçi tapılmadı'
            });
        }
        
        // Admin öz rolu dəyişə bilməz
        if (user._id.toString() === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'Öz rolunuzu dəyişə bilməzsiniz'
            });
        }
        
        user.role = req.body.role;
        await user.save();
        
        res.status(200).json({
            success: true,
            message: 'İstifadəçi rolu uğurla dəyişdirildi',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server xətası'
        });
    }
});

// @desc    Bütün layihələri əldə et (admin)
// @route   GET /api/admin/projects
// @access  Private/Admin
router.get('/projects', [auth, admin], async (req, res) => {
    try {
        const projects = await Project.find().populate('userId', 'username email').sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            projects
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server xətası'
        });
    }
});

// @desc    Bütün layihələri sil
// @route   DELETE /api/admin/projects
// @access  Private/Admin
router.delete('/projects', [auth, admin], async (req, res) => {
    try {
        await Project.deleteMany({});
        
        res.status(200).json({
            success: true,
            message: 'Bütün layihələr uğurla silindi'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server xətası'
        });
    }
});

module.exports = router;