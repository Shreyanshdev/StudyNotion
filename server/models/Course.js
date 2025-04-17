const mongoose = require("mongoose");
const Categories = require("./Categories");

const courseSchema = new mongoose.Schema({
    courseName:{
        type:String,
        required:true,
        trim:true,
    },
    courseDescription:{
        type:String,
        required:true,
        trim:true,
    },
    instructor:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"User",
    },
    whatYouWillLearn:{
        type:String,
        required:true,
    },
    
    courseContent :[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref:"Section",
        } 
    ],
    ratingAndReview :[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref:"RatingAndReview",
        } 
    ],
    price: {
        type:Number,
    },
    thumbnail:{
        type:String,
    },
    category : {
        type:mongoose.Schema.Types.ObjectId,
        ref:"Categories",
    },
    tag: {
        type:String,
    },
    studentsEnrolled:[{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"User",
    }],
    instructions: {
        type:[String],
    },
    status: {
        type:String,
        enum: ["Draft" , "Published"]
    },

});

module.exports = mongoose.model("Course" , courseSchema);