'use strict'
   
require('./model')

const mongoose = require('mongoose')
const Devices = mongoose.model('Devices')

module.exports = {
  // fetch all devices from DB
  async getAll() {
    return await Devices.find({})
  },
  // add new device to DB
  async addNew(device) {
    // dup check
    let existingDevice = await Devices.find({ key: device.key })
    if (Array.isArray(existingDevice) && existingDevice.length > 0) {
      // already in DB
      console.log(`device key already exists: '${device.key}'`)
      //throw `device key already exists: '${device.key}'`
      return
    } else {
      // create new device in DB
      return await new Devices(device).save()
    }
  },
  // compare function for sorting by PCI addresses
  pciCompare(a, b) {
    return a.pciAddress.localeCompare(b.pciAddress)
  }
}