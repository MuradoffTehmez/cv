const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Project = require('../models/Project');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @desc    İstifadəçi profilini əldə et
// @route   GET /api/user/profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        
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

// @desc    İstifadəçi profilini yenilə
// @route   PUT /api/user/profile
// @access  Private
router.put('/profile', [
    auth,
    [
        body('profile.name')
            .optional()
            .isLength({ max: 50 })
            .withMessage('Ad ən çox 50 simvol uzunluğunda ola bilər'),
        body('profile.title')
            .optional()
            .isLength({ max: 100 })
            .withMessage('Vəzifə ən çox 100 simvol uzunluğunda ola bilər'),
        body('profile.location')
            .optional()
            .isLength({ max: 100 })
            .withMessage('Yer ən çox 100 simvol uzunluğunda ola bilər'),
        body('profile.phone')
            .optional()
            .matches(/^[\+]?[1-9][\d]{0,15}$/)
            .withMessage('Zəhmət olmasa düzgün telefon nömrəsi daxil edin')
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

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'İstifadəçi tapılmadı'
            });
        }

        // Profil məlumatlarını yenilə
        user.profile = { ...user.profile, ...req.body.profile };

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Profil uğurla yeniləndi',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                profile: user.profile
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

// @desc    Şifrəni dəyiş
// @route   PUT /api/user/changepassword
// @access  Private
router.put('/changepassword', [
    auth,
    [
        body('currentPassword')
            .notEmpty()
            .withMessage('Hazırkı şifrə tələb olunur'),
        body('newPassword')
            .isLength({ min: 6 })
            .withMessage('Yeni şifrə ən azı 6 simvol uzunluğunda olmalıdır')
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

        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user.id).select('+password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'İstifadəçi tapılmadı'
            });
        }

        // Hazırkı şifrəni yoxla
        const isMatch = await user.matchPassword(currentPassword);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Hazırkı şifrə səhvdir'
            });
        }

        // Yeni şifrəni təyin et
        user.password = newPassword;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Şifrə uğurla dəyişdirildi'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server xətası'
        });
    }
});

// @desc    İstifadəçinin layihələrini əldə et
// @route   GET /api/user/projects
// @access  Private
router.get('/projects', auth, async (req, res) => {
    try {
        const projects = await Project.find({ userId: req.user.id }).sort({ createdAt: -1 });
        
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

module.exports = router;