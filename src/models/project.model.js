import mongoose from "mongoose";
import { type } from "os";

const projectSchema = new mongoose.Schema(
    {
        title: { 
            type: String, 
            required: true, 
            trim: true 
        },
        description: {
            abstract: { 
                type: String, 
                required: true, 
                trim: true 
            },
            problemStatement: { 
                type: String, 
                required: true, 
                trim: true 
            },
            proposedMethodology: { 
                type: String, 
                required: true, 
                trim: true 
            },
            techStack: {
                type: [String],
                lowercase: true,
                trim: true,
                validate: {
                    validator: function (v) {
                        return new Set(v).size === v.length;
                    },
                    message: "Tech stack must have unique values.",
                },
            },
        },
        summary: {
            type: String,
            default: "",
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        assignedMentor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null, 
        },
        teamMembers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        mentorRequests: [
            { 
                type: mongoose.Schema.Types.ObjectId, 
                ref: "User" 
            }
        ],
        documents: [  
            {
                name: { 
                    type: String, 
                    unique: true,
                    required: true, 
                    trim: true 
                },
                publicId:{
                    type: String, 
                    required: true
                },
                url: { 
                    type: String, 
                    required: true 
                },
                format: { 
                    type: String, 
                    trim: true 
                }, 
                uploadedAt: { 
                    type: Date, 
                    default: Date.now 
                },
                type:{
                    type: String,
                    enum: ["project SRS", "presentation", "report","other"],
                    default: "other",
                    trim: true,
                }
            }
        ],
        status: {
            type: String,
            enum: ["pending", "approved", "rejected", "completed"],
            default: "pending", 
            index: true,
        },
        review: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

projectSchema.virtual("totalMembers").get(function () {
    return this?.teamMembers?.length ; 
});

projectSchema.pre("save", function (next) {
    this.description.techStack = [...new Set(this.description.techStack)];
    next();
});

export const Project = mongoose.model("Project", projectSchema);
