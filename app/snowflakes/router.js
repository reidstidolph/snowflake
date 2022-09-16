'use strict'
   
const express = require('express')
const router = express.Router()

const controller = require('./controller')
const prefix = 'api/snowflakes'
const devicemapPrefix = 'api/snowflakes/devicemap'

router.get(`/${prefix}`, controller.getAll)
router.post(`/${devicemapPrefix}`, controller.updateDevicemap)

module.exports = router