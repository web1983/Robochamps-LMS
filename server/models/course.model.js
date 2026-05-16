import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
    courseTitle:{
        type:String,
        required:true
    },
     subTitle:{
        type:String,
    },
     description:{
        type:String,
    },
     category:{
        type:String,
        required:true
    },
     courseLevel:{
        type:String,
        enum:["Beginner", "Medium", "Advance"]
    },
     coursePrice:{
        type:String,
    },
    courseThumbnail:{
        type:String,
    },
    videoDuration:{
        type:String,
    },
    projectName:{
        type:String,
    },
    kit:{
        type:String,
        enum:["Starter Kits", "Intermediate Kit", "Advanced Kit"]
    },
    learningOutcomes:[{
        type:String
    }],
    videoStatus:{
        type:String,
    },
    videoUrl:{
        type:String,
    },
    testQuestions:[{
        question: String,
        options: [String],
        correctAnswer: Number
    }],
    testTimeLimit:{
        type:Number,
        default:20 // minutes
    },
    lectures:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Lecture"
        }
    ],
    creator:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    isPublished:{
        type:Boolean,
        default:false
    },
    isLive:{
        type:Boolean,
        default:false
    }
}, {timestamps:true});

export const Course = mongoose.model("Course", courseSchema)