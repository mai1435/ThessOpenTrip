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

onmessage = function(e) {

var lat=e.data[0];
var lon=e.data[1];
var nearDistance=e.data[2];
var locationObject=e.data[3];
//console.log(url+JSONdata);
var result=null;

function calculateDistance(lat1,lon1,lat2,lon2)
 {
      var R = 6371; // km
      var dLat = toRad(lat2-lat1);
      var dLon = toRad(lon2-lon1);
      var lat1 = toRad(lat1);
      var lat2 = toRad(lat2);

      var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      var d = R * c;
      return d;
    }


   function toRad(Value) 
    {
        return Value * Math.PI / 180;
    }


    var dist=calculateDistance(lat,lon,locationObject.userLatitude,locationObject.userLongitude);
    if(dist<=nearDistance){
        result=true;
    }else{
        result=false;
    }
	postMessage(result);
  
}
