'use strict'
const helpers = require('./helpers')

// compare function for sorting by PCI addresses
function pciCompare(a, b) {
  return a.pciAddress.localeCompare(b.pciAddress)
}

// function to transform snowflake input
function processNewDevice(rawDeviceInput) {

  // instantiate new snowflake object
  let snowflake = {
    ...{raw: rawDeviceInput},
    ...rawDeviceInput
  }

  // instantiate a networks array 
  snowflake.networks = {}

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

    // process network snowflake
    if (!pciBusTestResults && !usbBusTestResults) {

      // skip and log if businfo is not PCI or USB
      console.log(`ERROR: got unknown PCI businfo: ${network.businfo}`)
      return

    } else if (pciBusTestResults) {

      // got a PCI ethernet snowflake
      // create ethernet array if it doesn't exist
      if (!snowflake.networks.ethernet) {
        snowflake.networks.ethernet = []
      }
      // set additional network object details
      outputNetwork.pciAddress = pciBusTestResults.groups.busId
      outputNetwork.product = network.product
      outputNetwork.vendor = network.vendor
      snowflake.networks.ethernet.push(outputNetwork)
      
      return

    } else if (usbBusTestResults) {
      
      // got a usb snowflake
      // see if LTE
      if(network.configuration && network.configuration.driver == 'qmi_wwan') {
        // got a LTE snowflake
        // create lte array if it doesn't exist
        if (!snowflake.networks.lte) {
          snowflake.networks.lte = []
        }
        // set additional network object details
        outputNetwork.targetInterface = network.logicalname
        outputNetwork.product = network.product
        outputNetwork.vendor = network.vendor
        snowflake.networks.lte.push(outputNetwork)
      }
    }
  })

  // sort networks by PCI addr
  snowflake.networks.ethernet.sort(pciCompare)

  // construct snowflake key
  snowflake.key = `${snowflake.baseboardManufacturer}_${snowflake.baseboardProductName}_${snowflake.baseboardSerialNumber}_${snowflake.chassisManufacturer}_${snowflake.chassisSerialNumber}_${snowflake.systemManufacturer}_${snowflake.systemProductName}_${snowflake.systemSerialNumber}`

  return snowflake
}

// export module
module.exports = {
	async getAll(req, res) {
		try {
      const snowflakes = await helpers.getAll({})

      return res.send(snowflakes)
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
