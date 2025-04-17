const mongoose = require("mongoose");
require("dotenv").config();

exports.connect = () => {
    mongoose.connect(process.env.MONGODB_URL )
    .then( () => console.log("DB connection succesfull"))
    .catch( (error) => {
        console.log("db connection error");
        console.error(error);
        process.exit(1);
    })
}