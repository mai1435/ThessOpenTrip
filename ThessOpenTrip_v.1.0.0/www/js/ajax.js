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

    var url=e.data[0];
    var JSONdata=e.data[1];
    var result=null;
    //var serverChangeTimes=0;
    
    function load(url, callback) {
    	var xhr;
     
    	if(typeof XMLHttpRequest !== 'undefined')
            xhr = new XMLHttpRequest();
    	else {
    		var versions = ["MSXML2.XmlHttp.5.0", 
    			 	"MSXML2.XmlHttp.4.0",
    			 	"MSXML2.XmlHttp.3.0", 
    			 	"MSXML2.XmlHttp.2.0",
    			 	"Microsoft.XmlHttp"]
                                   
     
    		for(var i = 0, len = versions.length; i < len; i++) {
    		try {
    			xhr = new ActiveXObject(versions[i]);
    			break;
    		}
    			catch(e){}
    		} // end for
    	}
    		
    	xhr.onreadystatechange = ensureReadiness;
    		
    	function ensureReadiness() {
    		if(xhr.readyState < 4) {
    			return;
    		}
    
    			
    		if(xhr.status !== 200) {
                postMessage(xhr.status);	
    		    return;
    		}
     
    		// all is well	
    		if(xhr.readyState === 4) {
    			callback(xhr);
    		}			
    	}
    		
    	xhr.open('POST', url, true);
    	xhr.send(JSONdata);
    	xhr.addEventListener("error", requestFailed, false);
    }
    
    function requestFailed(e){
    	//console.log(e);    
    	//postMessage(e);
    }
    	
    //and here is how you use it to load a json file with ajax
    load(url, function(xhr) {	
    	result = xhr.responseText;
    	postMessage(result);
    });
  
}