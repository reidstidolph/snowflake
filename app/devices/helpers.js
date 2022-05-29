'use strict'
   
require('./model')

const mongoose = require('mongoose')
const Devices = mongoose.model('Devices')

module.exports = {
  async getAll() {
    return await Devices.find({})
  },
  async addNew(device) {
    let existingDevice = await Devices.find({ key: device.key })
    if (Array.isArray(existingDevice) && existingDevice.length > 0) {
      console.log(`device key already exists: '${device.key}'`)
      //throw `device key already exists: '${device.key}'`
      return
    } else {
      return await new Devices(device).save()
    }
  }
}