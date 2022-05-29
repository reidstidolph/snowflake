'use strict'

const script = require('./inspect')

// export module
module.exports = {
	async getScript(req, res) {
		try {
      return res.send(script)
    } catch (error) {
      return res.status(400).send({
        status: 'failure'
      })
    }
  }
}
