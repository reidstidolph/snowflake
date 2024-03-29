'use strict'
const helpers = require('./helpers')

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

  async updateDevicemap(req, res) {
    try {
      await helpers.updateDevicemap(req.body)
    } catch (error) {
      return res.status(400).send({
        status: 'failure'
      })
    }
  }
}
