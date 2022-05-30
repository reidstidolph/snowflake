'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const DevicesSchema = new Schema({
	date: { type: Date, default: Date.now },
	baseboardManufacturer: {
		type: String,
		required: true
	},
	baseboardProductName: {
		type: String,
		required: true
	},
	baseboardSerialNumber: {
		type: String,
		required: true
	},
	baseboardVersion: {
		type: String,
		required: true
	},
	biosReleaseDate: {
		type: String,
		required: true
	},
	biosVendor: {
		type: String,
		required: true
	},
	biosVersion: {
		type: String,
		required: true
	},
	chassisManufacturer: {
		type: String,
		required: true
	},
	chassisSerialNumber: {
		type: String,
		required: true
	},
	chassisType: {
		type: String,
		required: true
	},
	chassisVersion: {
		type: String,
		required: true
	},
	processorFamily: {
		type: String,
		required: true
	},
	processorFrequency: {
		type: String,
		required: true
	},
	processorManufacturer: {
		type: String,
		required: true
	},
	processorVersion: {
		type: String,
		required: true
	},
	systemManufacturer: {
		type: String,
		required: true
	},
	systemProductName: {
		type: String,
		required: true
	},
	systemSerialNumber: {
		type: String,
		required: true
	},
	systemVersion: {
		type: String,
		required: true
	},
	snowflake: {
		type: String,
		required: true
	},
	networks: {
		type: String,
		required: true,
		set: setRaw,
		get: getRaw
	},
	raw: {
		type: String,
		set: setRaw,
		get: getRaw,
		required: true
	}
},
{toJSON: {getters: true, setters:true}})

// convert raw string back to JSON
function getRaw(jsonString){
	return JSON.parse(jsonString)
}

function setRaw(jsonObject){
	return JSON.stringify(jsonObject)
}

mongoose.model('Devices', DevicesSchema)