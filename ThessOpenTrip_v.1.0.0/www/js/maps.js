// This file is part of ThessOpenTrip.
// 
// ThessOpenTrip is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// ThessOpenTrip is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License
// along with ThessOpenTrip. If not, see <http://www.gnu.org/licenses/>.

/**************************************************************
 ***************  LEAFLET MAPS  *******************************
 **************************************************************/   

   var map= null;
   var markers=null;
   var positionCircle=null;
   var zoom=null;
   var homeMarker=null;
   var mm = null;
   
   if(mode==="drive"){
     zoom=16;
   }else if(mode==="transportation"){
     zoom=16;
   }else if(mode==="cycling"){
     zoom=16;
   }else{
       zoom=16;
   }
   
    //http://stackoverflow.com/questions/3583724/how-do-i-add-a-delay-in-a-javascript-loop
    var ii = 1000;                     //  set your counter to 1

    function loadMapLoop () {           //  create a loop function
        setTimeout(function () {    //  call a 3s setTimeout when the loop is called
            if (variableDefined(locationObject.userLatitude)){
                loadMap();
                unloadLoadingGif();
                loadReportButton();
                showTarget();
            } else{
                ii=ii+1000;
                loadMapLoop();
            }              
        }, ii);
    }
  
    function reloadMap(){
        if(map){
            map.remove();
            loadMap();
        }
    }

    function loadMap() { 
     
        var tile;
        map = new L.Map('mainPage', {minZoom:11,maxZoom:17,unloadInvisibleTiles:true,updateWhenIdle:true,reuseTiles:true,zoomControl:false}); //,minZoom:14,maxZoom:18 { zoomControl:false }
        
        if(mode=="drive"){
            tile = driveTile;
        }else if(mode=="transportation"){
            tile = transportTile;
        }else if(mode=="cycling"){
            tile = cycleTile;
        }else{
            tile = driveTile;
        }
        
        //var osmAttrib = 'Map data © OpenStreetMap contributors';
        currTileLayer = new L.TileLayer(tile, { attribution: osmAttrib,attributionControl: false });
        var osmAttrib = '';
    
        map.setView(new L.LatLng(locationObject.userLatitude, locationObject.userLongitude), zoom);
        map.addLayer(currTileLayer);
        map.attributionControl.setPrefix("");
        
        markers = new L.FeatureGroup();
        map.addLayer(markers); 
                
        startIntervalMap();
        //setTimeout(getReports,1000);  
        startIntervalgetReports();
      
        //map.on('movestart', mapScrol);  
        //The movestart event fires the event all the time!
    
        map.on('dragstart', mapScrol); 
        map.on('zoomstart', mapScrol); //popupopen
        map.on('popupopen', mapScrol); 
        //map.on('popupclose', setMapView); //popupclose
        
        //home marker
        //homeMarker= new L.FeatureGroup();
        //map.addLayer(homeMarker);  

        //==========================================DimTsoyk add============================================================
        
        
        if(mode==="walk"){
            mm = L.AwesomeMarkers.icon({
                markerColor: 'blue',
                icon: icon, //from index.html line 65
                prefix:'fa'
            }); 
        }else if (mode==="drive"){
            mm = new L.divIcon({
                className : "arrowIcon",
                iconAnchor: new L.Point(15,18), 
                html : '<img src="img/arrow.png" style = "-webkit-transform: rotate('+locationObject.heading+'deg); width:30px; height:auto">'});
        }else if(mode==="transportation"){
            mm = L.AwesomeMarkers.icon({
                markerColor: 'blue',
                icon: icon, //from index.html line 65
                prefix:'fa'
            }); 
        }else if(mode==="cycling"){
            mm = L.AwesomeMarkers.icon({
                markerColor: 'blue',
                icon: icon, //from index.html line 65
                prefix:'fa'
            }); 
        }

        //============================================================================================================    
        homeMarker=L.marker([locationObject.userLatitude, locationObject.userLongitude],{icon:mm, zIndexOffset:1000}).addTo(map);
    
        //positionCircle = L.circle([locationObject.userLatitude, locationObject.userLongitude], locationObject.accuracy, {
        //color: 'blue',
        //fillColor: '#0066FF',
        //fillOpacity: 0.5
        //}).addTo(map);
        
        //getLocation();
        //$("#map").removeClass('hide');
        //var mapCanvas = document.getElementById('map-canvas');
        //    var mapOptions = {
        //    credentials: "AuPcHmxjgV3j0Iy9BUHro1xFGXQ7OW0angPpZ3zvBx2UTweLPUDVBKTHdRBndWYL",
        //    mapTypeId: Microsoft.Maps.MapTypeId.road,
        //    center: new Microsoft.Maps.Location(locationObject.userLatitude, locationObject.userLongitude),
        //    enableSearchLogo: false,
        //    showDashboard: false,
        //    tileBuffer: 3,
        //    zoom: 16
        //};
        //map = new Microsoft.Maps.Map(document.getElementById("map-canvas"), mapOptions);
        //map = new Microsoft.Maps.Map(document.getElementById("mainPage"), mapOptions);
      
        //var center = map.getCenter();
        //var pin = new Microsoft.Maps.Pushpin(center, {draggable: true}); 
     
        //Add a handler for map scrol
        //Microsoft.Maps.Events.addHandler(map, 'mousedown', mapScrol);
        
        //Add a handler for map click
        //Microsoft.Maps.Events.addHandler(map, 'rightclick', displayEventInfo);
        
        // Add a handler to the pushpin drag (https://msdn.microsoft.com/en-us/library/gg427615.aspx)
        //if(mode==="walk"){
        //Microsoft.Maps.Events.addHandler(pin, 'mouseup', DisplayLoc);
        //map.entities.push(pin);
        //}
              
        //loadTrafficModule();
        
        //startIntervalMap();
        
        //setTimeout(getReports,1000);
        //getReports();
        //createPois();
        //drawPois();
        
        loadPoisFromDb();
    }
    
    function mapScrol(e){
        //console.log(e);        
        //clearInterval(intervalRefreshMap);
        
        /*If the user scrols the map, the image is frozen. Press the | button or send a report*/
        stopIntervalMap(); 
        
        if(debug){
           console.log("Map has been freezed");
        }
        
        //stopIntervalLoc();        
        //setTimeout(startIntervalMap,120000);
        //setTimeout(startIntervalLoc,120000);
    }

     
    function setMapView(){
        if(map) {
            //reloadMap();
            map.setView([locationObject.userLatitude, locationObject.userLongitude]);
            //map.locate({setView: true, maxZoom: 16});
        
            //Home Marker
            map.removeLayer(homeMarker);        
            //homeMarker= new L.FeatureGroup();
            //map.addLayer(homeMarker);  
        
            //============================================DimTsoyk add=========================================================
            
            
            if(mode==="walk"){
                mm = L.AwesomeMarkers.icon({
                    markerColor: 'blue',
                    icon: icon, //from index.html line 65
                    prefix:'fa'
                }); 
            }else if (mode==="drive"){
                mm = new L.divIcon({
                    className : "arrowIcon",
                    iconAnchor: new L.Point(15,18), 
                    html : '<img src="img/arrow.png" style = "-webkit-transform: rotate('+locationObject.heading+'deg); width:30px; height:auto">'});
            }else if(mode==="transportation"){
                mm = L.AwesomeMarkers.icon({
                    markerColor: 'blue',
                    icon: icon, //from index.html line 65
                    prefix:'fa'
                }); 
            }else if(mode==="cycling"){
                mm = L.AwesomeMarkers.icon({
                    markerColor: 'blue',
                    icon: icon, //from index.html line 65
                    prefix:'fa'
                }); 
            }
            //============================================================================================================
  
            homeMarker=L.marker([locationObject.userLatitude, locationObject.userLongitude],{icon:mm, zIndexOffset:1000}).addTo(map);
        
            //cicle
            //map.removeLayer(positionCircle);
            //positionCircle = L.circle([locationObject.userLatitude, locationObject.userLongitude], locationObject.accuracy, {
            //    color: 'blue',
            //    fillColor: '#0066FF',
            //    fillOpacity: 0.5
            //    }).addTo(map);
            //delete all markers:
            //map.removeLayer(markers);
            //start map interval
            //and get new reports:
            //getReports();
        
            if(debug){
                //console.log("Map is refresed at: "+new Date().getTime());
            }
                        
            if(instructionsMode){
                var dist = calculateDistance(planPois[poisIndex].poi.latitude,planPois[poisIndex].poi.longitude,locationObject.userLatitude,locationObject.userLongitude);
                if(dist < 0.05) {
                    
                    showAlertBootbox("You have arrived at " + planPois[poisIndex].poi.name,"Target Reached!");
                    
                    if (poisIndex < (planPois.length - 1)){
                        poisIndex = poisIndex + 1;
                        document.getElementById("instruction").innerHTML = "Next stop: " + planPois[poisIndex].poi.name;
                    }else{
                        document.getElementById("instruction").innerHTML = "Final Destination Reached!";
                        cancelPlan();
                    } 
                }
            }
        }
    }           

    function removeAllLayers(){    
        map.eachLayer(function (layer) {
            if(layer._leaflet_id !== 22 && layer._leaflet_id !== 20){
        	    map.removeLayer(layer);
    	    }	
        });
    }

    function startIntervalMap(){
        if(!intervalRefreshMap){
        intervalRefreshMap=setInterval(function(){ setMapView(); }, refreshMap);
        }
    }

    function stopIntervalMap(){
        clearInterval(intervalRefreshMap);
        intervalRefreshMap=null;
    }

    function startIntervalLoc(){
        intervalRefreshLocation=setInterval(function(){getLocation()},getLoacation);
    }

    function stopIntervalLoc(){
        clearInterval(intervalRefreshLocation);
        intervalRefreshLocation=null;
    }

    function startIntervalPositions(){
        intervalSendPositions=setInterval(function(){sendPeriodicPositions()},sendPositions);
    }

    function stopIntervalPositions(){
    	clearInterval(intervalSendPositions);
    	intervalSendPositions=null;
    }	

    function startIntervalcheckModeAndSpeeds(){
        intervalcheckModeAndSpeeds=setInterval(function(){checkSpeedAndMode()},checkModeAndSpeeds);
    }

    function stopIntervalPositions(){
        clearInterval(intervalcheckModeAndSpeeds);
    	intervalcheckModeAndSpeeds=null;
    }	

    function startIntervalgetReports(){
        if(!intervalGetReports){
            intervalGetReports=setInterval(function(){getReports()},getReportsInt);
        }
    }

    function stopIntervalgetReports(){
        clearInterval(intervalGetReports);
        intervalGetReports=null;
    }	

    function startIntervalAverages(){
        intervalAverages=setInterval(function(){averageMetrics()},checkModeAndSpeeds);
    }
    