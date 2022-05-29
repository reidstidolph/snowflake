'use strict'
const helpers = require('./helpers')

// export module
module.exports = {
  // get devices from DB
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
  
  // add a new device
  async addNew(req, res) {
    try {

      // process and transform device info
      let transformedDevice = helpers.processNewDevice(req.body)
      // add to DB
      await helpers.addNew(transformedDevice)
      return res.send('Device info received.')

    } catch (error) {

      return res.status(400).send({
        status: 'failure'
      })

    }
  }
}
