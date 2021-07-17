"use strict";

const ApiGateway = require("moleculer-web");
const { takeHeapSnapshot } = require("process");
const { ServiceBroker } 	= require("moleculer");
var express=require("express")
var bodyParser=require("body-parser")
var path=require("path")
const broker = new ServiceBroker();
/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 * @typedef {import('http').IncomingMessage} IncomingRequest Incoming HTTP Request
 * @typedef {import('http').ServerResponse} ServerResponse HTTP Server Response
 */
broker.loadService(path.join(__dirname,"tasks.service"));
broker.start()
module.exports = {
	name: "api",
	mixins: [ApiGateway],

	// More info about settings: https://moleculer.services/docs/0.14/moleculer-web.html
	settings: {
		// Exposed port
		port: process.env.PORT || 3000,
		
		pageSize:50,
		maxRequestTimeOut:5*1000,

		// Exposed IP
		ip: "0.0.0.0",

		// Global Express middlewares. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Middlewares
		use: [],

		routes: [
			{
				path: "/api",

				whitelist: [
					"**"
				],

				// Route-level Express middlewares. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Middlewares
				use: [],

				// Enable/disable parameter merging method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Disable-merging
				mergeParams: true,

				// Enable authentication. Implement the logic into `authenticate` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authentication
				authentication: false,

				// Enable authorization. Implement the logic into `authorize` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authorization
				authorization: false,
				autoAliases: true,

				aliases: {
					"GET /tasks": "tasks.list",
					"POST /tasks": "tasks.register",
					"DELETE /tasks:id": "tasks.delete"
					
					
				},

				/** 
				 * Before call hook. You can check the request.
				 * @param {Context} ctx 
				 * @param {Object} route 
				 * @param {IncomingRequest} req 
				 * @param {ServerResponse} res 
				 * @param {Object} data
				 * 
				onBeforeCall(ctx, route, req, res) {
					// Set request headers to context meta
					ctx.meta.userAgent = req.headers["user-agent"];
				}, */

				/**
				 * After call hook. You can modify the data.
				 * @param {Context} ctx 
				 * @param {Object} route 
				 * @param {IncomingRequest} req 
				 * @param {ServerResponse} res 
				 * @param {Object} data
				onAfterCall(ctx, route, req, res, data) {
					// Async function which return with Promise
					return doSomething(ctx, res, data);
				}, */

				// Calling options. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Calling-options
				callingOptions: {},

				bodyParsers: {
					json: {
						strict: false,
						limit: "1MB"
					},
					urlencoded: {
						extended: true,
						limit: "1MB"
					}
				},

				// Mapping policy setting. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Mapping-policy
				mappingPolicy: "all", // Available values: "all", "restrict"

				// Enable/disable logging
				logging: true
			}
		],

		// Do not log client side errors (does not log an error response when the error.code is 400<=X<500)
		log4XXResponses: true,
		// Logging the request parameters. Set to any log level to enable it. E.g. "info"
		logRequestParams: null,
		// Logging the response data. Set to any log level to enable it. E.g. "info"
		logResponseData: null,


		// Serve assets from "public" folder. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Serve-static-files
		assets: {
			folder: "public",

			// Options to `server-static` module
			options: {}
		}
	},

	created(){
		var app=express();
		// app.use(bodyParser.urlencoded({extended:false}))
		app.use(express.json());
		this.givenRoutes(app);
		this.app=app
	},

	started(){
		var port=Number(this.settings.port)
		
		this.app.listen(port,function(err){
			if(err){
				return this.broker.fatal(err)
			}
			else{
				console.log("Server started.........")
			}
		});
	},
	stopped(){
		if(this.app.listening){
			this.app.close(function(err){
				if(err){
					console.log(err)
				}
				else{
					console.log("Server stopped .........")
				}
			})
		}
	},
	methods: {
		
		givenRoutes(app){
			
			app.post("/register",function(req,res){
				try{
					let {targetUrl}=req.body
					console.log(req.body)
					var webHook=broker.call("tasks.register",{targetUrl});
					var { out_id }=webHook;
					res.json({
						message:"New hook has been added",
						_id:out_id
					})
				}
				catch(err){
					res.json({
						message:err.message
					})
				}
			})
			app.get("/list",function(req,res){
				// var { size }=this.settings;
				var lst=broker.call("tasks.list");
				res.json({
					message:"All Urls",
					lst
				})

			})

			app.put("/update",function(req,res){
				try{
					let {_id,targetUrl}=req.body;
					var updatewebHook=broker.call("tasks.update",{_id,targetUrl});
					// var { out_id }=webHook;
					res.json({
						message:"Hook has been updated",
						updatewebHook
					})
				}
				catch(err){
					res.json({
						message:err.message
					})
				}

			})

			app.delete("/delete",function(req,res){
				
				try{
					var { _id} = req.body;
					var deleteHook=broker.call("tasks.remove",{_id:_id});
					res.json({
						message:"Hook deleted",
						deleteHook
					})
				}
				catch(err){
					res.json({
						message:err.message
					})
				}
			})
			app.get("/ip",function(req,res){
				
				try{
					let ipAddress=req.headers["x-forwarded-for"] || req.socket.remoteAddress
					
					var results=broker.call("tasks.trigger",{ipAddress})
					res.json({
						message:"Status of urls",
						results
					})
				}
				catch(err){
					res.json({
						message:err.message
					})
				}
			})


		},
		
		async authenticate(ctx, route, req) {
			// Read the token from header
			const auth = req.headers["authorization"];

			if (auth && auth.startsWith("Bearer")) {
				const token = auth.slice(7);

				// Check the token. Tip: call a service which verify the token. E.g. `accounts.resolveToken`
				if (token == "123456") {
					// Returns the resolved user. It will be set to the `ctx.meta.user`
					return { id: 1, name: "John Doe" };

				} else {
					// Invalid token
					throw new ApiGateway.Errors.UnAuthorizedError(ApiGateway.Errors.ERR_INVALID_TOKEN);
				}

			} else {
				// No token. Throw an error or do nothing if anonymous access is allowed.
				// throw new E.UnAuthorizedError(E.ERR_NO_TOKEN);
				return null;
			}
		},

		/**
		 * Authorize the request. Check that the authenticated user has right to access the resource.
		 *
		 * PLEASE NOTE, IT'S JUST AN EXAMPLE IMPLEMENTATION. DO NOT USE IN PRODUCTION!
		 *
		 * @param {Context} ctx
		 * @param {Object} route
		 * @param {IncomingRequest} req
		 * @returns {Promise}
		 */
		async authorize(ctx, route, req) {
			// Get the authenticated user.
			const user = ctx.meta.user;

			// It check the `auth` property in action schema.
			if (req.$action.auth == "required" && !user) {
				throw new ApiGateway.Errors.UnAuthorizedError("NO_RIGHTS");
			}
		}

	}
};
