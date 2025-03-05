This project will demonstrate the difference in repeated API requests when using a Redis-based caching system and using plain requests.
We will be using the RestCountries API to obtain the capitals of a fixed list of countries with time metrics to record how long the combined requests take.

To set up this workshop, first beginning installation of Docker. This is essential to allowing Redis to be hosted on some external server.
You can find the link to do so [here] (https://www.docker.com/get-started/)

While this is installing you can set up the GitHub using
```
git clone https://github.com/aspothuri/Redis-Workshop.git
```
Then run
```
cd Redis-Workshop
```
to enter the GitHub repository directory and use 
```
docker exec -it redis redis-cli
```
to begin running the docker engine with the redis-cli library.
Next we must cd into the captials-wiki folder and install modules using
```
cd captials-wiki
npm install
```
This will ensure all the necessary node modules are installed for this project.

Once this initial set up is complete and Docker is installed and running, you can run the server using
```
node server.js
```
Then to interact with this server, a basic UI is provided in index.html.
Open the HTML file in a browser to view the content.

You can play around with the caching and no caching methods to see the effects of Redis caching systems on these types of projects.

Enjoy!!! Please let me know if there are any issues.
