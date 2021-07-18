
# Microservices Services
## Usage
Start the project with `npm run dev` command. 
After starting, open the http://localhost:3000/ URL in your browser. 
On the welcome page you can test the generated services via API Gateway and check the nodes & services.

In the terminal, try the following commands:
- `nodes` - List all connected nodes.
- `actions` - List all registered service actions.
- `call tasks.list` - Call the `tasks.list` action which returns all the targetUrls from the database.
- `call tasks.register` - Call the `tasks.register` action with the `targetUrl` as a parameter and adds that targetUrl with unique id into the database.

- `call tasks.update` - call `tasks.update` action with `newUrl` and `_id` as parameters and update it at the given `id` if the parmeter `_id` is not preset it gives message as the `id not found in the database`

- `call tasks.remove` - Call the `tasks.remove` action which takes the parameter `_id` and delete the document with given id.
- `call tasks.trigger` - Call the `tasks.trigger` action which has a parameter `ipAddress` returns all the targetUrls from the database and send post request to all the targetUrls with body as {"ipAddress":ipAddress,"timestamp":UNIX timestamp} 10 parllel requests per batch as given in the task and prints to the console which requests are successfull (statusCode=200) and which are failed.


## Methods
# axiosRetry()
Takes parameters `url (Object)` `data (Object)` to be posted and `retries`
sends a post request to the url from the url object if we get a statusCode==200 then we return 
{"success":true,"url_details":url is (Object)}
Otherwise we retry the request atMost 5 times if it is failed after that also then we return
{"success":false,"url_details":url url is (Object)}

# parallelRequests
Takes parameters `urls (array)` `data (Object)`
makes 10 parallel requests

# parallelRequestsLimit
Takes parameters `urls (array)` `data (Object)` `limit Integer`
makes all the requests into batches as per the given limit and execute it
will print all the requests made with status of each promise either fulfilled or rejected and value of each promise object with deatils of the url and success message

## Services
- **api**: API Gateway services
- 
- **tasks**: Sample DB service. To use with MongoDB, set `MONGO_URI` environment variables and install MongoDB adapter with `npm i moleculer-db-adapter-mongo`.

## backend
written thebackend part of the code in api.service.js
which has all the routes as required /register,/list,/update,/delete,/ip
## Mixins
- **db.mixin**: Database access mixin for services. Based on [moleculer-db](https://github.com/moleculerjs/moleculer-db#readme)


<!--  -->
Setting was done  only locally
<!--  -->
## NPM scripts

- `npm run dev`: Start development mode (load all services locally with hot-reload & REPL)

