'use strict'
   
const express = require('express')
const router = express.Router()

const controller = require('./controller')
const prefix = 'api/snowflakes'

router.get(`/${prefix}`, controller.getAll)

module.exports = router