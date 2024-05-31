const mongoose = require('mongoose');
const {schema, model} = mongoose;

const userSchema = mongoose.Schema({
    email:{
        type:String,
        required:true,
        unique:false
    },
    password:{
        type:String,
        required:false,
    },first_name:{
        type:String,
        required:true,
        unique:false
    },last_name:{
        type:String,
        required:true,
        unique:false
    },
})

const userModel = mongoose.model('Users', userSchema,);
module.exports = userModel;