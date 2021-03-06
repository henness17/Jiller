/**********************************************
 * SECTION 1:
 * This file controls the setting for the map
 * on the map page. The API for Modest Maps
 * is located at http://modestmaps.com/
 *
 * It also is acting as theh data controller as 
 * now. It manipulates the data retrieved and
 * creates a pop up with the information.
 * 
 * @Authors Ryan Henness, Lindsey Kramer, and JD Michlanski 
 *********************************************/

/* GLOBAL VARIABLES */
var xhr = new XMLHttpRequest();
var geocode = new XMLHttpRequest();
var geoData;
var results; // store JSON for geo location section
var userLoc; // location from the user bio
var myInterval;

  // Response handlers.
  xhr.onload = function() {

    // collect response text of JSON    
    var responseText = xhr.responseText;

    // getting user info from JSON
    var parsedData = JSON.parse(xhr.responseText); // parse the JSON data
    console.log(parsedData);
    var statuses = parsedData["statuses"]; // create variable for statuses of JSON
    i = 0;

    myInterval = setInterval(function() {
        console.log(i);
        var parsedTweet = statuses[i]["text"]; //parse the text of the tweeet 
        var userName = statuses[i]["user"]["screen_name"]; 
        console.log(userName);
        // getting the location long and lat of the users bio location
        userLoc = statuses[i]["user"]["location"]; // get location
        var urlID = statuses[i]["user"]["id_str"]; 
        makeGeoCORSRq(); //call Geo CORS request

        geocode.onload = function(){
            // create variable for results
            initMap(); // redraw the map for the new tweet
            console.log(results);
            var userLong = results[0]["geometry"]["location"]["lng"]; // parse the latitude
            var userLat = results[0]["geometry"]["location"]["lat"]; // parse the longitude

            
            console.log(userLong);
            console.log(userLat);
            console.log(userLoc);

            parsedTweet = parsedTweet.substring(0,85) + "...@" + userName;     
            parsedTweet = parsedTweet.link("http://twitter.com/"+userName+"/status/"+urlID); 

            // //parse hashtags, urls, and usernames 
            // String.prototype.parseHashtag = function() {  
            //   return this.replace(/[#]+[A-Za-z0-9-_]+/g, function(t) {  
            //        var tag = t.replace("#","%23")  
            //        return t.link("http://search.twitter.com/search?q="+tag);  
            //   });  
            // }; 

            // String.prototype.parseURL = function() {  
            //   return this.replace(/[A-Za-z]+:\/\/[A-Za-z0-9-_]+\.[A-Za-z0-9-_:%&~\?\/.=]+/g, function(url) {  
            //        return url.link(url);  
            //   });  
            // };  

            // String.prototype.parseUsername = function() {  
            //   return this.replace(/[@]+[A-Za-z0-9-_]+/g, function(u) {  
            //        var username = u.replace("@","")  
            //        return u.link("http://twitter.com/"+username);  
            //   });  
            //  };  

            // // call the parsing functinos on the tweet
            // parsedTweet = (parsedTweet.parseURL().parseUsername().parseHashtag()); 
            
            //if((userLat != null) && (userLong != null)){
            var popUp = new MM.Follower(map, new MM.Location(userLat, userLong), parsedTweet); 
            //}   
            console.log("done");
            }
        i++;
        if(i > 20){
            window.clearInterval(myInterval);
        }  
    }, 6000);
  };

  xhr.onerror = function() {
    alert('Woops, there was an error making the request.'); 
  };


// TLC: Do the work of initializing the page at the start of time.
var page = (function() {

    var self = this;
    
    var init=function() {

    console.log('Initialized.');
    // This behavior only needs to happen once.
    console.log("Adding behavior to the button");
    var button = document.getElementById('data'); 
    button.onclick = makeCorsRequest; 
    initMap();

    self.need_init=false;
    }
    
    return {
    doit: function() {

        // If init hasn't been called yet, call it.
        if(typeof self.need_init==='undefined') {
        init();
        }

        else { console.log("I hate you"); }
        // Otherwise, do nothing.
    }
    };
    })();
page.doit();



function initMap() {

    console.log("initting");
    var layer = new MM.TemplatedLayer("http://otile1.mqcdn.com/tiles/1.0.0/osm/{Z}/{X}/{Y}.png");
    map = new MM.Map('map', layer)
    
    var minZoom = 1;
    var maxZoom = 2;
    var topLeft = new MM.Location(51.4, -131.8);
    var bottomRight = new MM.Location(21.5, -50.5);

    // override map limits so that panning and zooming are constrained within these bounds:
    map.coordLimits = [
      map.locationCoordinate(topLeft).zoomTo(minZoom),
      map.locationCoordinate(bottomRight).zoomTo(maxZoom)
    ];

    // override provider limits so that tiles are not loaded unless they are inside these bounds:
    layer.tileLimits = [
      map.locationCoordinate(topLeft).zoomTo(minZoom),
      map.locationCoordinate(bottomRight).zoomTo(maxZoom)
   ];

    // override sourceCoordinate so that it doesn't use coord limits to wrap tiles
    // but so that it rejects any tile coordinates that lie outside the limits
    layer.sourceCoordinate = function(coord) {
        // don't need .container() stuff here but it means *something* will get loaded at low zoom levels
        // e.g. at level 0 the base tile could contain the entire extent
        // skip the .container() stuff if you don't want to load/render tiles outside the extent *at all*
        var TL = this.tileLimits[0].zoomTo(coord.zoom).container();
        var BR = this.tileLimits[1].zoomTo(coord.zoom).container().right().down();
        if (coord.row < TL.row || coord.row >= BR.row || coord.column < TL.column || coord.column >= BR.column) {
            // it's too high or too low or too lefty or too righty:
            //console.log(coord.toString() + " is outside bounds");
            return null;
        }
        // otherwise it's cool, let it through
        return coord;
    }

    map.setCenterZoom(new MM.Location(39.7618, -98.8811), 5);

};

/**********************************************
 * SECTION 2:
 * This next section of the code controls
 * how the pop up is defined on the map.
 * It is called above to set the details
 * of your pop up.
 *********************************************/


// namespacing!
if (!com) {
    var com = { };
    if (!com.modestmaps) {
        com.modestmaps = { };
    }
}

(function(MM) {

    MM.Follower = function(map, location, content) {
        this.coord = map.locationCoordinate(location);
        
        this.offset = new MM.Point(0, 0);
        this.dimensions = new MM.Point(150, 150);
        this.margin = new MM.Point(10, 10);
        this.offset = new MM.Point(0, -this.dimensions.y);

        var follower = this;
        
        var callback = function(m, a) { return follower.draw(m); };
        map.addCallback('drawn', callback);
        
        this.div = document.createElement('div');
        this.div.style.position = 'absolute';
        this.div.style.width = this.dimensions.x + 'px';
        this.div.style.height = this.dimensions.y + 'px';

        var shadow = document.createElement('canvas');
        this.div.appendChild(shadow);
        if (typeof G_vmlCanvasManager !== 'undefined') shadow = G_vmlCanvasManager.initElement(shadow);
        shadow.style.position = 'absolute';
        shadow.style.left = '0px';
        shadow.style.top = '0px';
        shadow.width = this.dimensions.x*2;
        shadow.height = this.dimensions.y;
        var ctx = shadow.getContext("2d");
        ctx.transform(1, 0, -0.5, 0.5, 75, this.dimensions.y/2);
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        this.drawBubblePath(ctx);
        ctx.fill();
    
        var bubble = document.createElement('canvas');
        this.div.appendChild(bubble);
        if (typeof G_vmlCanvasManager !== 'undefined') bubble = G_vmlCanvasManager.initElement(bubble);
        bubble.style.position = 'absolute';
        bubble.style.left = '0px';
        bubble.style.top = '0px';
        bubble.width = this.dimensions.x;
        bubble.height = this.dimensions.y;
        var bubCtx = bubble.getContext('2d');
        bubCtx.strokeStyle = 'black';
        bubCtx.fillStyle = 'white';
        this.drawBubblePath(bubCtx);
        bubCtx.fill();    
        bubCtx.stroke();    
        
        var contentDiv = document.createElement('div');
        contentDiv.style.wordWrap="break-word"; 
        contentDiv.style.position = 'absolute';
        contentDiv.style.fontSize="10px"
        contentDiv.style.left = '0px';
        contentDiv.style.top = '0px';
        contentDiv.style.overflow = 'hidden';    
        contentDiv.style.width = (this.dimensions.x - this.margin.x) + 'px';
        contentDiv.style.height = (this.dimensions.y - this.margin.y - 25) + 'px';    
        contentDiv.style.padding = this.margin.y + 'px ' + this.margin.x + 'px ' + this.margin.y + 'px ' + this.margin.x + 'px';
        contentDiv.innerHTML = content;    
        this.div.appendChild(contentDiv);
        
        MM.addEvent(contentDiv, 'mousedown', function(e) {
            if(!e) e = window.event;
            return MM.cancelEvent(e);
        });
        
        map.parent.appendChild(this.div);
        
        console.log(userLoc);
        this.draw(map);
    }
    
    MM.Follower.prototype = {
    
        div: null,
        coord: null,
        
        offset: null,
        dimensions: null,
        margin: null,
    
        draw: function(map) {
            try {
                var point = map.coordinatePoint(this.coord);
            } catch(e) {
                console.error(e);
                // too soon?
                return;
            }
            
            if(point.x + this.dimensions.x + this.offset.x < 0) {
                // too far left
                this.div.style.display = 'none';
            
            } else if(point.y + this.dimensions.y + this.offset.y < 0) {
                // too far up
                this.div.style.display = 'none';
            
            } else if(point.x + this.offset.x > map.dimensions.x) {
                // too far right
                this.div.style.display = 'none';
            
            } else if(point.y + this.offset.y > map.dimensions.y) {
                // too far down
                this.div.style.display = 'none';
    
            } else {
                this.div.style.display = 'block';
                MM.moveElement(this.div, { 
                    x: Math.round(point.x + this.offset.x),
                    y: Math.round(point.y + this.offset.y),
                    scale: 1,
                    width: this.dimensions.x,
                    height: this.dimensions.y
                });
            }
        },
        
        drawBubblePath: function(ctx) {
            ctx.beginPath();
            ctx.moveTo(10, this.dimensions.y);
            ctx.lineTo(35, this.dimensions.y-25);
            ctx.lineTo(this.dimensions.x-10, this.dimensions.y-25); 
            ctx.quadraticCurveTo(this.dimensions.x, this.dimensions.y-25, this.dimensions.x, this.dimensions.y-35);
            ctx.lineTo(this.dimensions.x, 10);
            ctx.quadraticCurveTo(this.dimensions.x, 0, this.dimensions.x-10, 0);
            ctx.lineTo(10, 0);
            ctx.quadraticCurveTo(0, 0, 0, 10);
            ctx.lineTo(0, this.dimensions.y-35);
            ctx.quadraticCurveTo(0, this.dimensions.y-25, 10, this.dimensions.y-25);
            ctx.lineTo(15, this.dimensions.y-25);
            ctx.moveTo(10, this.dimensions.y);
        }
    
    };
    
})(com.modestmaps)

/**********************************************
 * SECTION 3:
 * This section controls the data for Jiller.
 * It retrieves data from the Jiller server
 * that is hosted by heroku.com by making
 * a CORS request. 
 *
 * The CORS requests are split up into two,
 * one for the tweet, another for the Geocode.
 *
 * This code is adapted from an article 
 * written by Monsur Hossain on html5rocks.com. 
 *********************************************/

// Create the XHR object.
function createCORSRequest(method, url) {
  if ("withCredentials" in xhr) {
    // XHR for Chrome/Firefox/Opera/Safari.
    xhr.open(method, url, false);
  } else if (typeof XDomainRequest != "undefined") {
    // XDomainRequest for IE.
    xhr = new XDomainRequest();
    xhr.open(method, url);
  } else {
    // CORS not supported.
    xhr = null;
  }
  return xhr;
}

// Make the actual CORS request for Geocode
function makeCorsRequest(keywordSearch) {
    console.log("Make CORS request");
    var keywordSearch = document.getElementById('searchTerm').value;
    window.clearInterval(myInterval);
    // set the query for the url
    var url = 'http://whispering-bayou-9488.herokuapp.com/tweets_json.php?count=21&q=' + keywordSearch;

    var xhr = createCORSRequest('GET', url);
    if (!xhr) {
    alert('CORS not supported');
    return;
    }
    xhr.send();

    setInterval(makeCorsRequest, 100000); // make another request
 }
 
 //////////////////////////////////GEOCODE CORS////////////////////////////////////////////

function createGeoCORSRq() {
  if ("withCredentials" in geocode) {
    // XHR for Chrome/Firefox/Opera/Safari.
    geocode.open('GET', 'https://maps.googleapis.com/maps/api/geocode/json?address='+userLoc+'&key=AIzaSyAQJsPN1zJu6kQIGsUvw-1XQVWu-WBc7Sg', false);
  } else if (typeof XDomainRequest != "undefined") {
    // XDomainRequest for IE.
    geocode = new XDomainRequest();
    geocode.open('GET', 'https://maps.googleapis.com/maps/api/geocode/json?address='+userLoc+'&key=AIzaSyAQJsPN1zJu6kQIGsUvw-1XQVWu-WBc7Sg');
  } else {
    // CORS not supported.
    geocode = null;
  }
  console.log(geocode);
  return geocode;
}
 
function makeGeoCORSRq() {
    geocode = createGeoCORSRq();
    if (!geocode) {
    alert('CORS not supported');
    return;
    }
    console.log(geocode);
    geocode.send();

    geoData = JSON.parse(geocode.responseText); // parse the JSON from geocode response
    results = geoData["results"];
 } 


 document.onreadystatechange = function () {
  var state = document.readyState
  if (state == 'interactive') {
       document.getElementById('contents').style.visibility="hidden";
  } else if (state == 'complete') {
      setTimeout(function(){
         document.getElementById('interactive');
         document.getElementById('load').style.visibility="hidden";
         document.getElementById('contents').style.visibility="visible";
      },1000);
  }
}
