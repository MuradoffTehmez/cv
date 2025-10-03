const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const generateToken = require('../utils/generateToken');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @desc    İstifadəçi qeydiyyatı
// @route   POST /api/auth/register
// @access  Public
router.post('/register', [
    body('username')
        .isLength({ min: 3 })
        .withMessage('İstifadəçi adı ən azı 3 simvol uzunluğunda olmalıdır')
        .isAlphanumeric()
        .withMessage('İstifadəçi adı yalnız hərflər və rəqəmlər ola bilər'),
    body('email')
        .isEmail()
        .withMessage('Zəhmət olmasa düzgün email ünvanı daxil edin')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Şifrə ən azı 6 simvol uzunluğunda olmalıdır')
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

        const { username, email, password } = req.body;

        // Eyni istifadəçi adı və ya email ilə istifadəçinin olub-olmamasını yoxla
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Bu email və ya istifadəçi adı artıq mövcuddur'
            });
        }

        // Yeni istifadəçi yarat
        const user = await User.create({
            username,
            email,
            password
        });

        // Token yarat
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'İstifadəçi uğurla qeydiyyatdan keçdi',
            token,
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

// @desc    İstifadəçi girişi
// @route   POST /api/auth/login
// @access  Public
router.post('/login', [
    body('username')
        .notEmpty()
        .withMessage('İstifadəçi adı tələb olunur'),
    body('password')
        .notEmpty()
        .withMessage('Şifrə tələb olunur')
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

        const { username, password } = req.body;

        // İstifadəçini username və ya email üzrə tap
        const user = await User.findOne({
            $or: [{ username }, { email: username }]
        }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'İstifadəçi adı və ya şifrə səhvdir'
            });
        }

        // Şifrəni yoxla
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'İstifadəçi adı və ya şifrə səhvdir'
            });
        }

        // Token yarat
        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: 'Giriş uğurludur',
            token,
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

// @desc    Şifrə sıfırlama token-i yarat
// @route   POST /api/auth/forgotpassword
// @access  Public
router.post('/forgotpassword', [
    body('email')
        .isEmail()
        .withMessage('Zəhmət olmasa düzgün email ünvanı daxil edin')
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

        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Bu email ünvanına aid istifadəçi tapılmadı'
            });
        }

        // Şifrə sıfırlama token-i yarat
        const resetToken = crypto.randomBytes(20).toString('hex');

        // Token-i hash et və expire vaxtını saxla
        user.resetPasswordToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 dəqiqə

        await user.save({ validateBeforeSave: false });

        try {
            const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/resetpassword/${resetToken}`;

            const message = `Şifrənizi sıfırlamaq üçün aşağıdakı linkə keçid edin:\n\n${resetUrl}\n\nBu link 10 dəqiqə sonra etibarsız olacaq.`;

            await sendEmail({
                email: user.email,
                subject: 'Şifrə Sıfırlama',
                message
            });

            res.status(200).json({
                success: true,
                message: 'Email şifrə sıfırlama linki ilə göndərildi'
            });
        } catch (err) {
            console.error(err);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;

            await user.save({ validateBeforeSave: false });

            return res.status(500).json({
                success: false,
                message: 'Email göndərmə xətası'
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server xətası'
        });
    }
});

// @desc    Şifrəni sıfırla
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
router.put('/resetpassword/:resettoken', async (req, res) => {
    try {
        // Token-i hash et
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.resettoken)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Token səhvdir və ya vaxtı bitib'
            });
        }

        // Yeni şifrəni təyin et
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        // Token yarat
        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: 'Şifrə uğurla dəyişdirildi',
            token
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server xətası'
        });
    }
});

// @desc    Cari istifadəçini əldə et
// @route   GET /api/auth/me
// @access  Private
router.get('/me', auth, async (req, res) => {
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

module.exports = router;