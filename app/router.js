'use strict'

const express = require('express')
const router = express.Router()

// Registered entity routes
router.use(require('./devices/router'))

module.exports = router