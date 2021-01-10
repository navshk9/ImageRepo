
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose.Promise = require("bluebird");

var UserSchema = new Schema({
    "firstName": {
        type: String,
        required: true
    },
    "lastName": {
        type: String,
        required: true
    },
    "userName": {
        type: String,
        unique: true,
        required: true
    },
    "password": {
        type: String,
        required: true
    }
});

module.exports = mongoose.model("Accounts", UserSchema);