const express = require('express');
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @desc    Bütün layihələri əldə et
// @route   GET /api/project
// @access  Public
router.get('/', async (req, res) => {
    try {
        const projects = await Project.find().populate('userId', 'username').sort({ createdAt: -1 });
        
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

// @desc    Tək layihəni əldə et
// @route   GET /api/project/:id
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id).populate('userId', 'username');
        
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Layihə tapılmadı'
            });
        }
        
        res.status(200).json({
            success: true,
            project
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server xətası'
        });
    }
});

// @desc    Layihə yarat
// @route   POST /api/project
// @access  Private
router.post('/', [
    auth,
    [
        body('title')
            .notEmpty()
            .withMessage('Layihə adı tələb olunur')
            .isLength({ max: 100 })
            .withMessage('Layihə adı ən çox 100 simvol uzunluğunda ola bilər'),
        body('description')
            .notEmpty()
            .withMessage('Layihə təsviri tələb olunur'),
        body('technologies')
            .optional()
            .isArray()
            .withMessage('Texnologiyalar massiv şəklində olmalıdır')
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

        const { title, description, technologies, startDate, endDate, status, imageUrl, projectUrl } = req.body;

        const project = await Project.create({
            title,
            description,
            technologies: technologies || [],
            startDate,
            endDate,
            status: status || 'active',
            imageUrl,
            projectUrl,
            userId: req.user.id
        });

        res.status(201).json({
            success: true,
            message: 'Layihə uğurla yaradıldı',
            project
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server xətası'
        });
    }
});

// @desc    Layihəni yenilə
// @route   PUT /api/project/:id
// @access  Private
router.put('/:id', [
    auth,
    [
        body('title')
            .optional()
            .isLength({ max: 100 })
            .withMessage('Layihə adı ən çox 100 simvol uzunluğunda ola bilər'),
        body('description')
            .optional()
            .isLength({ max: 1000 })
            .withMessage('Layihə təsviri ən çox 1000 simvol uzunluğunda ola bilər')
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

        let project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Layihə tapılmadı'
            });
        }

        // Yalnız layihənin sahibi layihəni yeniləyə bilər və ya admin
        if (project.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Bu əməliyyat üçün icazəniz yoxdur'
            });
        }

        project = await Project.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        res.status(200).json({
            success: true,
            message: 'Layihə uğurla yeniləndi',
            project
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server xətası'
        });
    }
});

// @desc    Layihəni sil
// @route   DELETE /api/project/:id
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Layihə tapılmadı'
            });
        }

        // Yalnız layihənin sahibi layihəni silə bilər və ya admin
        if (project.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Bu əməliyyat üçün icazəniz yoxdur'
            });
        }

        await Project.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Layihə uğurla silindi'
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