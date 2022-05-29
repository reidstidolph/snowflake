'use strict'
const helpers = require('./helpers')

// compare function for sorting by PCI addresses
function pciCompare(a, b) {
  return a.pciAddress.localeCompare(b.pciAddress)
}

// function to transform device input
function processNewDevice(rawDeviceInput) {

  // instantiate new device object
  let device = {
    ...{raw: rawDeviceInput},
    ...rawDeviceInput
  }

  // instantiate a networks array 
  device.networks = {}

  // iterate through network objects from input
  rawDeviceInput.networks.forEach((network)=>{
    // regex for extracting PCI bus numbers
    const pciBusRegex = /(?<busId>\d{4}:\d{2}:\d{2}\.\d)/
    const usbBusRegex = /usb@\d+:\d+/

    // skip if no pci bus info
    if (!network.businfo) {
      return
    }

    // instantiate a network object for saving
    let outputNetwork = {}
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
  device.networks.ethernet.sort(pciCompare)

  // construct device key
  device.key = `${device.baseboardManufacturer}_${device.baseboardProductName}_${device.baseboardSerialNumber}_${device.chassisManufacturer}_${device.chassisSerialNumber}_${device.systemManufacturer}_${device.systemProductName}_${device.systemSerialNumber}`

  return device
}

// export module
module.exports = {
	async getAll(req, res) {
		try {
      const devices = await helpers.getAll({})

      return res.send(devices)
    } catch (error) {
      return res.status(400).send({
        status: 'failure'
      })
    }
  },
  async addNew(req, res) {

    //console.log(req.body)

    try {
      await helpers.addNew(processNewDevice(req.body));

      return res.send({
        status: 'success'
      })
    } catch (error) {

      return res.status(400).send({
        status: 'failure'
      })
    }
  }
}
