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

  // function to transform device input
  processNewDevice(rawDeviceInput) {

    // instantiate new device object
    let device = {
      ...{raw: rawDeviceInput},
      ...rawDeviceInput
    }

    // clear the networks for re-write
    device.networks = {}

    // iterate through network objects from input
    rawDeviceInput.networks.forEach((network)=>{

      // regex for extracting PCI and USB bus numbers
      const pciBusRegex = /(?<busId>\d{4}:\d{2}:\d{2}\.\d)/
      const usbBusRegex = /usb@\d+:\d+/

      // skip if no pci bus info
      if (!network.businfo) {
        return
      }

      // instantiate a network object for saving
      let outputNetwork = {}
      // test to see if PCI or USB device
      let pciBusTestResults = pciBusRegex.exec(network.businfo)
      let usbBusTestResults = usbBusRegex.test(network.businfo)

      // process network device
      if (!pciBusTestResults && !usbBusTestResults) {

        // skip and log if businfo is not PCI or USB
        console.log(`ERROR: got unknown PCI businfo: ${network.businfo}`)
        return

      } else if (pciBusTestResults) {

        // got a PCI ethernet device
        // create ethernet array if it doesn't exist
        if (!device.networks.ethernet) {
          device.networks.ethernet = []
        }
        // set additional network object details
        outputNetwork.pciAddress = pciBusTestResults.groups.busId
        outputNetwork.product = network.product
        outputNetwork.vendor = network.vendor
        device.networks.ethernet.push(outputNetwork)
        
        return

      } else if (usbBusTestResults) {
        
        // got a usb device
        // see if LTE
        if(network.configuration && network.configuration.driver == 'qmi_wwan') {
          // got a LTE device
          // create lte array if it doesn't exist
          if (!device.networks.lte) {
            device.networks.lte = []
          }
          // set additional network object details
          outputNetwork.targetInterface = network.logicalname
          outputNetwork.product = network.product
          outputNetwork.vendor = network.vendor
          device.networks.lte.push(outputNetwork)
        }
      }
    })

    // sort networks by PCI addr
    device.networks.ethernet.sort((a, b) => {
      return a.pciAddress.localeCompare(b.pciAddress)
    })

    // construct device key
    device.key = `${device.baseboardManufacturer}_${device.baseboardProductName}_${device.baseboardSerialNumber}_${device.chassisManufacturer}_${device.chassisSerialNumber}_${device.systemManufacturer}_${device.systemProductName}_${device.systemSerialNumber}`

    return device
  }
}