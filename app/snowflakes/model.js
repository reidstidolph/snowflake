'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const SnowflakesSchema = new Schema({
	baseboardManufacturer: {
		type: String,
		required: true
	},
	baseboardProductName: {
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
	networks: {
		type: String,
		required: true,
		set: setRaw,
		get: getRaw
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

mongoose.model('Snowflakes', SnowflakesSchema)