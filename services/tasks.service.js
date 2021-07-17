"use strict";
const axios = require('axios')
const DbMixin = require("../mixins/db.mixin");
const { uuid } = require("uuidv4")

const DbService = require("moleculer-db");
const MongoAdapter = require("moleculer-db-adapter-mongo");

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
	name: "tasks",
	// version: 1

	/**
	 * Mixins
	 */
	mixins: [DbMixin("tasks")],
	// mixins: [DbService],
	// adapter: new MongoAdapter("mongodb://localhost/DYTE"),
	// collection: "tasks",
	/**
	 * Settings
	 */
	settings: {
		// Available fields in the responses
		fields: [
			"_id",
			// "id",
			"targetUrl"
			
		],

		// Validator for the `create` & `insert` actions.
		entityValidator: {
			// id:"string",
			targetUrl: "string"
		}
	},

	/**
	 * Action Hooks
	 */
	// hooks: {
	// 	before: {
	// 		/**
	// 		 * Register a before hook for the `create` action.
	// 		 * It sets a default value for the quantity field.
	// 		 *
	// 		 * @param {Context} ctx
	// 		 */
	// 		create(ctx) {
	// 			ctx.params.quantity = 0;
	// 		}
	// 	}
	// },

	/**
	 * Actions
	 */
	actions: {
		/**
		 * The "moleculer-db" mixin registers the following actions:
		 *  - list
		 *  - find
		 *  - count
		 *  - create
		 *  - insert
		 *  - update
		 *  - remove
		 */

		// register, update ,list ,trigger
		list:{
			async handler(ctx){
				try{
					let urls=await this.adapter.find({_type:'tasks'});
					// console.log("All urls",urls)
					return urls;
					
				}
				catch(err){
					console.log("failed to fetch all target urls")
					console.log(err)
				}
			}
		},
		register:{
			params:{
				targetUrl:'string'
			},

			async handler(ctx){
				
				try{
					console.log("Check in register route",ctx.params);
					var { targetUrl } = ctx.params;
					let url;
					url=await this.adapter.insert({
						// id,
						targetUrl
					});
					console.log(url)
					return url._id;
				}
				catch(err){
					console.log("error while registering target url");
					console.log(err);
				}
				
			},
		},

		update:{
			params:{
				_id:'string',
				targetUrl:'string'
			},

			async handler(ctx){
				console.log("update",ctx.params);
				var {id,targetUrl}=ctx.params;
				// let urls=await this.adapter.find({_type:'tasks'});
				// console.log(typeof(urls[0]._id))
				// console.log(urls)
				// var o_id=new ObjectId(id)
				// console.log(typeof(o_id))
			
				// console.log(o_id)
				try{
					let url=await this.adapter.findById(id);
					console.log("url is",url)
					
					if(!url){
						console.log("There is no such id to update with the given url");
						return "There is no such id to update with the given url";
					}
					else{
						
						url.targetUrl=targetUrl;
						const update = {
							"$set": url
						};
						url=await this.adapter.updateById(id,update);
						return "update success";
					}
				}
				catch(err){
					console.log(err)
				}
				

				
			},
		},
		remove:{
			// rest:"DELETE /:id",
			params:{
				_id:'string',
				// targetUrl:'string'
			},

			async handler(ctx){
				
				try{
					var {id}=ctx.params;
					let url=await this.adapter.findById(_id);
					console.log("url is",url)
					
					if(!url){
						return "id not found in the database"
					}
					else{
						url=await this.adapter.deleteById(ctx.params._id)
						return "delete success";
					}
					
					
				}
				catch(err){
					console.log("not found in the data base")
					console.log(err)
				}
				
				
			},
		},

		trigger:{
			rest: "GET /ipAddress/:ipAddress",
			params:{
				ipAddress:'string'
			},

			async handler(ctx){
				console.log(ctx.params);
				var {ipAddress}=ctx.params;
				console.log(ipAddress)
				let urls=await this.adapter.find({_type:'tasks'});
				// printing all the urls from the database
				console.log(urls)
				var data={
					ipAddress:ipAddress,
					timestamp:Date.now()
				}
				this.parallelRequestsLimit(urls,10,data)
				.then((res)=>{
					console.log(res[0].value)
					// return JSON.stringify(res[0].value)
				})

				
				
				

			},
		},

		
		
	},

	/**
	 * Methods
	 */
	methods: {
	
		axiosRetry(url,data,maxRetries=5){
			return new Promise( (resolve, reject) => {
				let r_count=0;
				var callAxios = ()=> axios
					.post(url.targetUrl, data)
					.then(res => {
						console.log(`statusCode: ${res.status}`)

						if(res.status==200){
							resolve({"success":true,"url_details":url})
							return 
						}
						else{
							if (r_count<maxRetries) {
								callAxios();
								r_count+=1;
							} else {
								reject({"success":false,"url_details":url})
								// return
								// throw new Error(res)
							}
						}
						
					}).catch(error => {
						if (r_count<maxRetries) {
							callAxios();
							r_count+=1;
						} else {
							reject({"success":false,"url_details":url})
						}
					})

					callAxios()
			})
		},
		

		parallelRequests(urls,data){
			return new Promise( (resolve, reject) => {
				console.log(data)
				let promises=[];
				for(let i=0;i<urls.length;i++){
					console.log(urls[i].targetUrl)
					// promises.push(this.makeSingleAxiosRequest(urls[i].targetUrl,data));
					promises.push(this.axiosRetry(urls[i],data));
				}
				Promise.allSettled(promises)
				.then((results) => {
				console.log("All done", results);
				
				resolve(results)
				})
				.catch((e) => {
					console.log(e)
				});
				 
			})
		},

		parallelRequestsLimit(urls,limit,data){
			return new Promise((resolve ,reject)=>{
				let promises=[];
				while(urls.length>0){
					promises.push(this.parallelRequests(urls.splice(0,limit),data))
				}

				Promise.allSettled(promises)
				.then((results) => {
				console.log("All done group by check", results);
				
				resolve(results)
				})
				.catch((e) => {
					console.log(e)
				});
				 

			})
		}



	},

	/**
	 * Fired after database connection establishing.
	 */
	async afterConnected() {
		// await this.adapter.collection.createIndex({ name: 1 });
	}
};
