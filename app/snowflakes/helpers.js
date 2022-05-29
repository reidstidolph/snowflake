'use strict'
   
require('./model')

const mongoose = require('mongoose')
const Snowflakes = mongoose.model('Snowflakes')

module.exports = {
  async getAll() {
    return await Snowflakes.find({})
  }
}