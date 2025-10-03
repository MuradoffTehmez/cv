const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Layihənin adı tələb olunur'],
        trim: true,
        maxlength: [100, 'Layihə adı ən çox 100 simvol uzunluğunda ola bilər']
    },
    description: {
        type: String,
        required: [true, 'Layihə təsviri tələb olunur'],
        maxlength: [1000, 'Layihə təsviri ən çox 1000 simvol uzunluğunda ola bilər']
    },
    technologies: [{
        type: String,
        trim: true
    }],
    startDate: {
        type: Date,
        required: [true, 'Başlama tarixi tələb olunur']
    },
    endDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'on-hold'],
        default: 'active'
    },
    imageUrl: {
        type: String
    },
    projectUrl: {
        type: String
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Project', projectSchema);