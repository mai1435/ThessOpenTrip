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


        //$( document ).ready(function() {
//document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady(){           
if(window.localStorage.length>0){
               getToken();
           }
           
        alert('log,DOM has been loaded');   
           
           //show user email
           var iuser=document.getElementById('iuser');
           var email=window.localStorage.getItem("email");
           iuser.innerHTML=email;
           
//Get the location
 getLocation();             
           
           
/**************************************************************
 ***************  GOOGLE MAPS  ********************************
 **************************************************************/  
  //google.maps.event.addDomListener(window, 'load', initialize);
  //google.maps.event.addDomListener(window, 'load', loadMap);
  loadMap();
  
  //startIntervalMap();
           
 /*****************************************************************
 ****** Report sending  *******************************************
 ******************************************************************/
//           
//           var clickHandler = ('ontouchstart' in document.documentElement ? "touchstart" : "click");
//
//            $("#accident").bind(clickHandler,function(){
//                locationObject["type"]="accident";
//                sendReport();
//            });

        


      
        
        
        
        
        
        
        
        
        }

