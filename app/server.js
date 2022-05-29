'use strict'

const port = process.env.PORT || 8080
const dbRetryTime = process.env.db_retry_time || 2000
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const router = require('./router')
const mongoose = require('mongoose')
const MONGO_PORT = 27017
const mongoUri = `mongodb://${process.env.db_service_name}:${MONGO_PORT}/${process.env.db_name}`

// set up db connection
let db = mongoose.connection
let connectWithRetry = function () {
  return mongoose.connect(mongoUri, {
    useUnifiedTopology: true,
    useNewUrlParser: true
  })
}

db.on('error', () => {
	setTimeout(() => {
		console.log('DB connection failed. Will try again.')

		connectWithRetry()
  }, dbRetryTime)
})

db.on('connected', function () {
  app.use(router)

  app.listen(port, () => console.log(`All set up. Listening on ${port}!`))
})

// initiate connection
connectWithRetry()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))