'use strict'
   
require('./model')

const mongoose = require('mongoose')
const Snowflakes = mongoose.model('Snowflakes')
const ObjectId = require('mongodb').ObjectID;

module.exports = {
  async getAll() {
    return await Snowflakes.find({})
  },

  async updateDevicemap(request) {
    return await Snowflakes.updateOne({"_id": ObjectId(request.id)}, {$set: {devicemap: request.devicemap}})
  }
}