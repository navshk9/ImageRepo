
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose.Promise = require("bluebird");

var photoSchema = new Schema({
    "filename": {
        type: String,
        unique: true
    },
    "uploadedOn": {
        type: Date,
        default: Date.now()
    },
    "private": {
        type: String,
        default: "off"
    },
    "owner": {
        type: String,
        default: "none"
    }
});

module.exports = mongoose.model("Photos", photoSchema);