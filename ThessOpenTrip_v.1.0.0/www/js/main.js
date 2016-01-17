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
  


        /**********************************************
         ****** First step  ***************************
         **********************************************/
        if(localStorage.length>3){ //User is logedin
        var divL=document.getElementById('unauthenticated');
        divL.className="hide";
        document.getElementById('mainPage').className="";
        document.getElementById('menuBar').className="";
        
        
        
        
        
        
        //Report button
        //setTimeout(loadReportButton,2000);
        //load the target
        //setTimeout(showTarget,2000);
        
             }else{
                 document.getElementById('unauthenticated').className="";
                 hideReportButton();
             }
             
        /* THE DEBUGGER !! */
//        if(debug){
//            //http://83.212.168.47:8081/target/target-script-min.js
//            var imported = document.createElement('script');
//            imported.src = 'http://83.212.168.47:8081/target/target-script-min.js';
//            document.head.appendChild(imported);        
//        }
        
        //Report Button width
        //var oxs=12-xs;
        //document.getElementById('reportMbutton').className="col-xs-"+xs;
        //document.getElementById('reportSbutton').className="col-xs-"+oxs;
        
        
        /*settings CheckBox*/
        /*
        if(mode==="drive"){
            document.getElementById("mode1").checked = true;
            document.getElementById("mode2").checked = false;
        }else{
            document.getElementById("mode1").checked = false;
            document.getElementById("mode2").checked = true;
        }
        document.getElementById("nearDistance").value=nearDistance;
        document.getElementById("loadReportsTime").value=loadReportsTime;
        document.getElementById("inputServer").value=server;
        
        if(showNotificationForIncomingReport==="true"){
            document.getElementById("showNotificationForIncomingReport").checked = true;
        }else{
            document.getElementById("showNotificationForIncomingReport").checked = false;
        }
     */
/**************************************************************
 ***************  GOOGLE MAPS  ********************************
 **************************************************************/        

  
        
//    function initialize() {
//    var mapCanvas = document.getElementById('map-canvas');
//    var mapOptions = {
//      center: new google.maps.LatLng(locationObject.latitude, locationObject.longitude),
//      zoom: 8,
//      mapTypeId: google.maps.MapTypeId.ROADMAP
//    }
//    var map = new google.maps.Map(mapCanvas, mapOptions);
//  }
//  google.maps.event.addDomListener(window, 'load', initialize);

//var GORYOKAKU_JAPAN = new plugin.google.maps.LatLng(41.796875,140.757007);
//
//var map = plugin.google.maps.Map.getMap({
//  'backgroundColor': 'white',
//  'mapType': plugin.google.maps.MapTypeId.HYBRID,
//  'controls': {
//    'compass': true,
//    'myLocationButton': true,
//    'indoorPicker': true,
//    'zoom': true
//  },
//  'gestures': {
//    'scroll': true,
//    'tilt': true,
//    'rotate': true
//  },
//  'camera': {
//    'latLng': GORYOKAKU_JAPAN,
//    'tilt': 30,
//    'zoom': 15,
//    'bearing': 50
//  }
//});
//
//var clickHandler = ('ontouchstart' in document.documentElement ? "touchstart" : "click");
//
//            $("#accident").bind(clickHandler,function(){               
//                alertify.confirm('Send an accident report?', function(e){ 
//                  if(e){
//                  locationObject["type"]="accident";
//                  sendReport();
//                  }
//                });                 
//            });
//
////            $("#accident").click(function(){
////                locationObject["type"]="accident";                
////                sendReport();
////            });
//  
//            $("#traffic").bind(clickHandler,function(){
//                alertify.confirm('Send a traffic report?', function(e){ 
//                  if(e){
//                  locationObject["type"]="traffic";
//                  sendReport();
//                  }
//                });             
//            });
//           
//            $("#works").bind(clickHandler,function(){
//                alertify.confirm('Send works report?', function(e){ 
//                  if(e){
//                  locationObject["type"]="works";
//                  sendReport();
//                  }
//                }); 
//            });
//           
//            $("#weather").bind(clickHandler,function(){
//                alertify.confirm('Send weather report?', function(e){ 
//                  if(e){
//                  locationObject["type"]="weather";
//                  sendReport();
//                  }
//                }); 
//            });
//            
//
