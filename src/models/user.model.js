import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

/*
    @todo list
*/
//add gender for male female default png
//add phone no. for whastapp Api msg or nomal msg


const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            maxlength: [50, "Name cannot exceed 50 characters"],
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            trim: true,
            lowercase: true,
            match: [
                /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
                "Please provide a valid email",
            ],
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [8, "Password must be at least 8 characters"],
            select: false, 
        },
        role: {
            type: String,
            enum: ["student", "mentor", "admin"],
            default: "student",
        },
        status: {
            type: String,
            enum: {
                values: ["pending", "active", "inactive", "rejected"],
                message: "Status must be either: pending (awaiting verification), active (verified), inactive (temporarily disabled), or rejected (verification denied)"
            },
            default: function() {
                // Mentors require verification before becoming active
                return this.role === "mentor" ? "pending" : "active";
            },
            required: [true, "Account status is required"]
        },
        roll_no: {
            type: String,
            unique: true,
            partialFilterExpression: { role: "student" },
            required: function () {
                return this.role === "student"; 
            },
        },
        avatar: {
            publicId: {
                type: String,
                default: "default_avatar.png",
            },
            url:{
                type:String,
                default: "https://res.cloudinary.com/garvitadlakha08/image/upload/v1745998142/b2nsmmeoqfyenykzeaiu.png",
            }
        },
        bio: {
            type: String,
            maxlength: [300, "Bio cannot exceed 300 characters"],
            default: function(){
                if(this.role === "mentor"){
                    return "Mentor";
                }
                else if(this.role === "admin"){
                    return "Admin";
                }
                else if(this.role === "student"){
                    return "Student";
                }
                else{
                    return "User";
                }
            }
        },
        university: {
            type: String,
        },
        department: {
            type: String,
        },
        yearOfStudy: {
            type: Number,
        },
        skills: [{ type: String }], 
        cgpa: {
            type: Number,
            min: [0, "CGPA cannot be negative"],
            max: [10, "CGPA cannot exceed 10"],
        },
        expertise: [
            {
                type: String, 
                default:null    
            }
            
        ], // Relevant for mentors
        availability: {
            type: Boolean,
            default: true, // Only for mentors
        },
        resetPasswordToken: String,
        resetPasswordExpire: Date,
        lastActive: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }
    const salt = await bcrypt.genSalt(Number(process.env.BCRYPT_SALT_ROUNDS) || 10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare entered password with hashed password
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash reset password token
userSchema.methods.getResetPasswordToken = function () {
    const resetToken = crypto.randomBytes(20).toString("hex");
    this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    return resetToken;
};

// Update last active timestamp
userSchema.methods.updateLastActive = async function () {
    this.lastActive = Date.now();
    await this.save();
};

export const User = mongoose.model("User", userSchema);
