const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'İstifadəçi adı tələb olunur'],
        unique: true,
        trim: true,
        minlength: [3, 'İstifadəçi adı ən azı 3 simvol uzunluğunda olmalıdır'],
        maxlength: [30, 'İstifadəçi adı ən çox 30 simvol uzunluğunda ola bilər']
    },
    email: {
        type: String,
        required: [true, 'Email tələb olunur'],
        unique: true,
        lowercase: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Zəhmət olmasa düzgün email ünvanı daxil edin'
        ]
    },
    password: {
        type: String,
        required: [true, 'Şifrə tələb olunur'],
        minlength: [6, 'Şifrə ən azı 6 simvol uzunluğunda olmalıdır']
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    profile: {
        name: {
            type: String,
            default: '',
            maxlength: [50, 'Ad ən çox 50 simvol uzunluğunda ola bilər']
        },
        title: {
            type: String,
            default: '',
            maxlength: [100, 'Vəzifə ən çox 100 simvol uzunluğunda ola bilər']
        },
        bio: {
            type: String,
            default: '',
            maxlength: [500, 'Haqqımda məlumatı ən çox 500 simvol uzunluğunda ola bilər']
        },
        location: {
            type: String,
            default: '',
            maxlength: [100, 'Yer ən çox 100 simvol uzunluğunda ola bilər']
        },
        phone: {
            type: String,
            default: '',
            match: [/^[\+]?[1-9][\d]{0,15}$/, 'Zəhmət olmasa düzgün telefon nömrəsi daxil edin']
        },
        avatar: {
            type: String,
            default: ''
        },
        social: {
            linkedin: {
                type: String,
                default: ''
            },
            github: {
                type: String,
                default: ''
            },
            twitter: {
                type: String,
                default: ''
            }
        }
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date
}, {
    timestamps: true
});

// Şifrəni hash etmək üçün middleware
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next();
    }
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Şifrəni yoxlamaq üçün method
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);