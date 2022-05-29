'use strict'
   
const express = require('express')
const router = express.Router()

const controller = require('./controller')
const prefix = 'inspect.sh'

router.get(`/${prefix}`, controller.getScript)

module.exports = router