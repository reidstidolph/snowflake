'use strict'
   
require('./model')

const mongoose = require('mongoose')
const Devices = mongoose.model('Devices')
const Snowflakes = mongoose.model('Snowflakes')

module.exports = {

  // fetch all devices from DB
  async getAll() {
    return await Devices.find({})
  },

  // add new device to DB
  async addNew(device) {
    // dup check
    let existingDevice = await Devices.find({ 
      baseboardManufacturer: device.baseboardManufacturer, 
      baseboardProductName: device.baseboardProductName, 
      baseboardSerialNumber: device.baseboardSerialNumber,
      chassisManufacturer: device.chassisManufacturer,
      chassisSerialNumber: device.chassisSerialNumber,
      systemManufacturer: device.systemManufacturer,
      systemProductName: device.systemProductName,
      systemSerialNumber: device.systemSerialNumber
     })

    if (Array.isArray(existingDevice) && existingDevice.length > 0) {
      // already in DB, return
      console.log(`device already exists: '${device.baseboardManufacturer} ${device.baseboardProductName} ${device.baseboardSerialNumber}'`)
      return
    }

    // only look for snowflake if device has fully populated info
    if (
      device.baseboardManufacturer && device.baseboardManufacturer.length > 0 &&
      device.baseboardProductName && device.baseboardProductName.length > 0 &&
      device.systemManufacturer && device.systemManufacturer.length > 0 &&
      device.systemProductName && device.systemProductName.length > 0
    ) {
      // find device snowflake
      let snowflake = {
        baseboardManufacturer: device.baseboardManufacturer, 
        baseboardProductName: device.baseboardProductName,
        systemManufacturer: device.systemManufacturer,
        systemProductName: device.systemProductName,
        networks: device.networks
      }
      
      let existingSnowflake = await Snowflakes.findOne(snowflake)

      if (existingSnowflake && existingSnowflake['_id']) {
        // matches existing snowflake
        device.snowflake = existingSnowflake['_id']
      } else {
        // add new snowflake
        let newSnowflake = await new Snowflakes(snowflake).save()
        device.snowflake = newSnowflake['_id']
      }

    } else {
      console.log(`INFO: Device received with insufficient info, skipping snowflake lookup.`)
      device.snowflake = "N/A"
    }

    // create new device in DB
    return await new Devices(device).save()
  },

  // function to transform device input
  processNewDevice(rawDeviceInput) {

    // instantiate new device object
    let device = {
      ...{raw: rawDeviceInput},
      ...rawDeviceInput
    }

    // throw out any QEMU VMs
    if (device.baseboardManufacturer == "QEMU" || device.systemManufacturer == "QEMU" || device.chassisManufacturer == "QEMU") {
      console.log(`INFO: Discarding QEMU VM.`)
      return null
    }

    // throw out any Xen VMs
    if (device.baseboardManufacturer == "Xen" || device.systemManufacturer == "Xen" || device.chassisManufacturer == "Xen") {
      console.log(`INFO: Discarding QEMU VM.`)
      return null
    }

    // clear the networks for re-write
    device.networks = {}

    // iterate through network objects from input
    rawDeviceInput.networks.forEach((network)=>{

      // regex for extracting PCI and USB bus numbers
      const pciBusRegex = /(?<busId>(\d|[a-f]){4}:(\d|[a-f]){2}:(\d|[a-f]){2}\.(\d|[a-f]))/
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
    if (device.networks.ethernet) {
      device.networks.ethernet.sort((a, b) => {
        return a.pciAddress.localeCompare(b.pciAddress)
      })
    }

    return device
  }
}