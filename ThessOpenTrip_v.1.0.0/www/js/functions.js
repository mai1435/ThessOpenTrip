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
    
function login(email,password){
   
    if(validateEmail(email)){ 
        var emailHashed=Sha1.hash(email);
        var  url= 'http://'+server+'/generateKS'; 	
        var  JSONdata='{"username":"'+email+'","password":"'+password+'"}';
        var ajaxWorker_generateKS=new Worker("js/ajax.js");
        ajaxWorker_generateKS.postMessage([url,JSONdata]);
        
        ajaxWorker_generateKS.onmessage= function(e){	
        	if(e.data==401 || e.data==500){
        		showAlert("Login failure");
        	}else{
                        
                if(email.indexOf("@") > -1){ 
                    userName = email.substring(0,email.indexOf("@"));
                }else{
                    userName = email;
                }
                window.localStorage.setItem("userName", userName);
                
        		obj=JSON.parse(e.data);
                key=obj.key;
                secret=obj.secret;
                var reportsJudged=new Array("1","2");
                //http://stackoverflow.com/questions/3357553/how-to-store-an-array-in-localstorage
                reportsJudged=JSON.stringify(reportsJudged);
                window.localStorage.setItem("email", emailHashed);
                window.localStorage.setItem("keyS", key);
                window.localStorage.setItem("secret", secret);
                window.localStorage.setItem("reportsJudged", reportsJudged);
                //load the main page
                var divL=document.getElementById('unauthenticated');
                divL.className="hide";
                document.getElementById('mainPage').className="";
                             
                            
                location.reload();            
    	    }
            
            ajaxWorker_generateKS.terminate();
        };
    }else{
        showAlert('Email is not in valid format');
    }
}


function LoginBtn(){
    var email=document.getElementById("login_email").value;
    var password=document.getElementById("login_password").value;
    login(email,password);
}


function logout(){
    //Logout confirmation
    var text="Are you sure you want to logout?";
    if(!freeze){
    freeze=true;
    var b=document.getElementsByClassName("navbar-toggle");b[0].click();
    bootbox.dialog({
    closeButton: false,
        title: "Please confirm",
        message: text,
        className: modalClass,
            buttons: {
                success: {
                label: "Ok",
                    className: "btn-success",
                    callback: function () {
                        window.localStorage.clear();
                        freeze=false;
                        location.reload();    
                    }
                },cancel:{
                    label: "Cancel",
                    className: "btn-default",
                    callback: function () {
                        bootbox.hideAll();
                        freeze=false;
                    }
                }
            }                                        
        });
    }
}


function getToken(){
    var key=window.localStorage.getItem("keyS");
    var secret=window.localStorage.getItem("secret");
    var token="";
    var url='http://'+server+'/generateToken';
    var JSONdata='{"key":"'+key+'","secret":"'+secret+'"}';
    var ajaxWorker_generateToken=new Worker("js/ajax.js");
    ajaxWorker_generateToken.postMessage([url,JSONdata]);
  
    ajaxWorker_generateToken.onmessage= function(e){
        var t=JSON.parse(e.data);
        token=t["access_token"];
        window.localStorage.setItem("token",token);	
        
        ajaxWorker_generateToken.terminate();
	};
}
//gets a token and stores it in the session


function sendReport(){
    var token=window.localStorage.getItem("token");
    var data=JSON.stringify(reportObject);    
    var email=window.localStorage.getItem("email");
    //var data=CryptoJS.AES.encrypt(JSON.stringify(reportObject),email+"_iti", {format: CryptoJSAesJson}).toString();
    var url_sendReports= 'http://'+server+'/sendReport';
    var JSONdata='{"access_token":"'+token+'","userId":"'+email+'","object":'+data+'}';

    freeze = true;
    bootbox.dialog({
        closeButton: false,
        size: 'small',
        message: "<center><img src='img/loading4.gif' class='img-responsive' alt='loading...'/></center><br><center>Sending Report..</center>",
        className: modalClass+" heightSmall",
        buttons: {}
    });
    
    function ifServerOnline(ifOnline, ifOffline)
    {
        var img = statusDiv.appendChild(document.createElement("img"));
        img.onload = function()
        {
            ifOnline && ifOnline.constructor == Function && ifOnline();
            //document.body.removeChild(img);
        };
        img.onerror = function()
        {
            ifOffline && ifOffline.constructor == Function && ifOffline();
            //document.body.removeChild(img);
        };
        img.src = "http://"+server+"/offline";        
    }
    
    ifServerOnline(function()
    {   
        setTimeout(function(){
            bootbox.hideAll();
            freeze = false; 
            if(debug){
                console.log("online");
            }
            var ajaxWorker_sendReport=new Worker("js/ajax.js");
            ajaxWorker_sendReport.postMessage([url_sendReports,JSONdata]); 
                
            ajaxWorker_sendReport.onmessage= function(e){  
                if(debug){
                    console.log(e.data);
                }                
                
                if(e.data==0 || e.data==500){
            	    showAlertBootbox("A network error occurred when trying to send the report. Please try again.","Error");
        	    }else {
        	        data=JSON.parse(e.data);
                    if(data['address']=="-"){
         		        showAlertBootbox("The address of the report cannot be found. Probably on wrong terrain.","Error");
        	        }else{
        		        showAlertBootbox("Report has been sent","Confirmed","Ok",3000);
        
                        var id=data['id']["$id"];
        	        }
                }
                
                ajaxWorker_sendReport.terminate();
            };
        }, 2000);
    },
    function ()
    {
        setTimeout(function(){
            bootbox.hideAll();
            freeze = false;
            if(debug){
            console.log("offline");
            }
            
            //showAlertBootbox("Error connecting to the server. Please try again.","Error");
            
            bootbox.dialog({
                closeButton: false,
                className: modalClass,
                title: 'Error',
                animate: false,
                backdrop: false,
                message: 'Error connecting to the server. Please try again.',
                buttons: {
                    success: {
                        label: 'Ok',
                        className: "btn-success",
                        callback: function () {
                            bootbox.hideAll();
                            //freeze=false;
                            var cm="";
                            if(reportObject.comments.length>2){
                                cm="<br /> Comments: "+reportObject.comments;
                            }
                            
                            var reportText="Type: "+capitalizeFirstLetter(reportObject.type)+"<br />Severity: "+capitalizeFirstLetter(reportObject.severity)+"<br />Location: "+storedAddress+cm;
                            
                            bootbox.dialog({
                                closeButton: false,
                                title: "Try again",
                                message: reportText,
                                className: modalClass,
                                buttons: {
                                    success: {
                                        label: "Send",
                                        className: "btn-success",
                                        callback: function () {
                                            sendReport();
                                            freeze=false;                                        
                                        }
                                    },cancel:{
                                        label: "Cancel",
                                        className: "btn-default",
                                        callback: function () {
                                            bootbox.hideAll();
                                            freeze=false;
                                        }
                                    }
                                }            
                            });  
                        }
                    }
                }
            });
        }, 2000);
    });
}


function getReports(){    
    var token=window.localStorage.getItem("token");
    var email=window.localStorage.getItem("email");
    var x=locationObject.userLatitude;
    var y=locationObject.userLongitude;
    //var nearDistance=window.localStorage.getItem("nearDistance");        
    var url= 'http://'+server+'/getReports';
    var now= Math.floor(Date.now()/1000);
    
    var JSONdata='{"access_token":"'+token+'","userId":"'+email+'","now":"'+now+'","time":'+loadReportsTime+',"x":"'+x+'","y":"'+y+'","nearDistance":"'+nearDistance+'"}';
    
    var heading=locationObject.heading;
    
    /********************DimTs ADD**************************/
    var curr_speed=locationObject.speed;    
    if((heading==null || curr_speed<=5)&&((mode==="drive") || (mode==="transportation"))){
        heading=averageAngle2(prevHeadings);   //calculate heading based on averageAngle2         
    }
    
    /*******************************************************/
    
    /*if(heading==null){
        for (var i = locations.length; i > 0; i--){
            heading=locations[i].heading;
            if(heading!=null){
                break;
            }
        }
    }
    
    console.log(""+heading);*/
    var ajaxWorker_getReports=new Worker("js/ajax.js");
    ajaxWorker_getReports.postMessage([url,JSONdata]);
    
    ajaxWorker_getReports.onmessage= function(e){
        //console.log(e.data);
        //---------Remove old reports--------
        map.removeLayer(markers);    
	    if(e.data==0){
		    //Network error
	    }if(e.data==401){
            getToken();
        }else{
		    var t=JSON.parse(e.data);                              
            var result=t["result"];                   
            var data=t["data"];                      
            if(map){
                var newReports=[];
                var evaluatedReports=[]; //Reports that have been already evaluated
                if(data){                                                    
                    
                    if(data.length>0){
                        var i=0;
                        var obj;
                        //map.removeLayer(markers);
                        markers = new L.FeatureGroup();
			            map.addLayer(markers);  

                        for (obj in data){
                            //var near=isReportNear_(data[obj]['reportLatitude'],data[obj]['reportLongitude']);
                            //optimal, near is calculated on server
                            var id=data[obj]["_id"]["$id"];
                            newReports.push(id);
                            var comments=data[obj]["comments"];
                            var severity=data[obj]["severity"];
                            var x_r = data[obj]["reportLatitude"];
                            var y_r = data[obj]["reportLongitude"];
                            //=========================================================================================
                            reliability = data[obj]["ProbabilityTF"];
                            severityRate = data[obj]["severity"];;
                            //=========================================================================================
                                
                            if(showSelfReports=="true"){
                                insertNewPushPin(data[obj],markers);
                            }
                                
                            if(data[obj]['RealTF']=="true"){
                                evaluatedReports.push(id);
                            }
                                                                
                            var dist = calculateDistance(x,y,x_r,y_r);
                                
                            //if(((mode==="drive" || mode==="transportation") && isHeadingTowards(x,y,x_r,y_r,heading)) || (mode==="walk") || (mode==="cycling")){ //if user drives/uses bus and is heading towards report or walks/cycles
                                if(dist<=nearDistanceOfNots){
                                    if(i<=inboxUpperLimit){
                                        if(data[obj]['RealTF']!="true"){ //Has not been judged yet
                                            insertNewMessage(data[obj]);
                                        }    
                                    }
                                    
                                    //Many reports block the screen, send only the first
                                    if(i==0 && showNotificationForIncomingReport==="true"){                                      
                                        reportNotification(data[obj]);                                
                                    }
                                }
                            //}
                            i++;
                        }                                                            
                    }   
                }
                //Remove from inbox reports that no loger exist
                for (rep in inboxMessageId){                                  
                    if(newReports.indexOf(inboxMessageId[rep])<0 || evaluatedReports.indexOf(inboxMessageId[rep])>-1){
                        removeReportFromInbox(rep,inboxMessageId[rep]);
                    }
                }
		    }
	    }
        
        ajaxWorker_getReports.terminate();
    };                            
};



function removeReportFromInbox(ind, id){
    inboxMessageId.splice(ind, 1);
    
    rows=rows-1;                            
    document.getElementById('inboxNumberOfMessages').innerHTML=rows;   

    //Zero messages should not be presented
    var d=document.getElementById('inboxNumberOfMessages');
    var dv=d.innerHTML;
    if(dv=="0"){
        d.className=d.className+" hide";
        document.getElementById('inboxNumberOfMessages').innerHTML="";
    }

    //document.getElementById("myTable").deleteRow(0);
    document.getElementById("1_"+id).parentNode.parentNode.parentNode.innerHTML="";
}



function sendLocation(){
    var token=window.localStorage.getItem("token");
    var email=window.localStorage.getItem("email");
    var data=JSON.stringify(locationObject);
    var url='http://'+server+'/sendPosition';
    var JSONdata='{"access_token":"'+token+'","userId":"'+email+'","locationObject":'+data+'}';

    var ajaxWorker_sendPosition=new Worker("js/ajax.js");
    ajaxWorker_sendPosition.postMessage([url,JSONdata]);
    
    ajaxWorker_sendPosition.onmessage= function(e){        
        if(e.data==0){
		    //Network error
	    }else{
		    //success
	    }
        
        ajaxWorker_sendPosition.terminate();
    };
};

//*********************************************************        
//*********        G E O L O C A T I O N  *****************
//*********************************************************
// 
// onSuccess Geolocation
function onSuccess(position) {
    var element = document.getElementById('geolocation');
    //if(debug){
    //element.innerHTML = 'DEBUG:<br />'+'Latitude: '           + position.coords.latitude              + '<br />' +
    //                    'Longitude: '          + position.coords.longitude             + '<br />' +
    //                    'Altitude: '           + position.coords.altitude              + '<br />' +
    //                    'Accuracy: '           + position.coords.accuracy              + '<br />' +
    //                    'Altitude Accuracy: '  + position.coords.altitudeAccuracy      + '<br />' +
    //                    'Heading: '            + position.coords.heading               + '<br />' +
    //                    'Speed: '              + position.coords.speed                 + '<br />' +
    //                    'Timestamp: '          + position.timestamp                    + '<br />';
    //        }
        
    //console.log(JSON.stringify(position.coords));
                    
    locationObject={
        "userLatitude":position.coords.latitude,
        "userLongitude":position.coords.longitude,
        //"reportLatitude":position.coords.latitude,
        //"reportLongitude":position.coords.longitude,
        //"altitude":position.coords.altitude,
        "accuracy":position.coords.accuracy,
        //"altitudeAccuracy":position.coords.altitudeAccuracy,
        "heading":position.coords.heading,
        "speed":position.coords.speed,
        //"mode":mode,
        //"time":position.timestamp.toString().substring(0,10)
        "time":Math.floor(Date.now()/1000)
    };        
    //element.innerHTML=JSON.stringify(locationObject);
    var values=['userLatitude','userLongitude','speed','accuracy'];
    for (key in values) {
        var val=values[key];
		if (locationObject[val]) {
            locationObject[val]=locationObject[val].toFixed(4);
		}
	}
        
    /************************Dim Tsouk Add ***************************************/
    if (locationObject.heading!=null && locationObject.speed>5 && (mode==="drive" || mode==="transportation")){
        if(prevHeadings.length>9){
            prevHeadings.shift();   //shift elements so as to array prevHeadings has always 10 elements
        }
        prevHeadings.push((locationObject.heading).toFixed(2)); //insert heading to  prevHeadings
    }
    /******************************************************************************/
        
    if(debug){
        console.log("Geolocation succeed at "+Math.floor(Date.now()/1000));
    }
    
    locations.push(locationObject);
    
}

    

// onError Callback receives a PositionError object
//https://developer.mozilla.org/en-US/docs/Web/API/PositionError
function onError(error) {
    var message="";
    if(error.code==2){
        message ="The device's location setting has been disabled. Please go to the device's settings, enable it, and restart the application.";            
        showAlertBootbox(message,"Location settings disabled.");
    }
    if(error.code==3){
        message ="Device's location provider does not respond. Either GPS signals are weak or GPS has been switched off. Please check the location settings on your device and restart the device or application.";
        showAlertBootbox(message,"Location settings do not respond.");
    }
    if(error.code==1){
        message ="The application is not allowed to retrieve position information, please check your settings";            
        showAlertBootbox(message,"Location settings are not accessible.");
    }
    if(debug){
        showAlertBootbox('code: '    + error.code    + '\n' +'message: ' + error.message + '.\n'+message);
    }       
}
    

function getLocation(){
    //it runs just once
    navigator.geolocation.getCurrentPosition(onSuccess, onError, {timeout:15000}); //timeout: 30000,        
    //locations.push(locationObject); 
}


function callAnothePage(page){
    window.location = page;
}


function forgotPassword(){
    var div=document.getElementById('passwordForgot');
    div.className="apollo-forgotten-password";
    var divL=document.getElementById('loginForm');
    divL.className="hide";
}


//Notifications
function alertDismissed() {
    //if(debug){
    //alertify.log('dismissed');
    //}
}

// Show a custom alertDismissed
function showAlert(message,title,buttonName) {
    //default values
    title = typeof title !== 'undefined' ? title : "Information";
    buttonName = typeof buttonName !== 'undefined' ? buttonName : "Ok";
        
    navigator.notification.alert(
        message,  // message
        alertDismissed,         // callback
        title,            // title
        buttonName                  // buttonName
    );
}
    

/*
* This function sends notifications by bootbox js method rather than with the notification alert
*/
function showAlertBootbox(message,title,buttonName,timeout){
    title = typeof title !== 'undefined' ? title : "Information";
    buttonName = typeof buttonName !== 'undefined' ? buttonName : "Ok";
    timeout = typeof timeout !== 'undefined' ? timeout : null;
        
    bootbox.dialog({
        closeButton: false,
        className: modalClass,
        title: title,
        animate: false,
        backdrop: false,
        message: message,
        buttons: {
            success: {
                label: buttonName,
                className: "btn-success",
                callback: function () {
                    bootbox.hideAll();
                    freeze=false;
                }
            }
        }
    });
    if(timeout){
        window.setTimeout(function(){
            bootbox.hideAll();
            freeze=false;
        }, timeout);
    }                    
}

    
function onConfirm(action){
    sendReport(action);   
}
    
    
function showConfirm(message,action,title,buttonNames) {
    title = typeof title !== 'undefined' ? title : "Please confirm";
    buttonNames = typeof buttonNames !== 'undefined' ? buttonNames : ['Cancel','Ok'];
    action = typeof action !== 'undefined' ? action : null;
        
    navigator.notification.confirm(
        message, // message
        onConfirm(action),            // callback to invoke with index of button pressed
        title,           // title
        buttonNames         // buttonLabels
    );
}
    
    
//http://stackoverflow.com/questions/18883601/function-to-calculate-distance-between-two-coordinates-shows-wrong
function calculateDistance(lat1,lon1,lat2,lon2) {
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


function isReportNear_(lat,lon){
    var dist=calculateDistance(lat,lon,locationObject.userLatitude,locationObject.userLongitude);
    if(dist<=nearDistance){
        return true;
    }else{
        return false;
    }
}


var distanceWorker=new Worker("js/nearDistance.js");
function isReportNear(lat,lon){
    distanceWorker.postMessage([lat,lon,nearDistance,locationObject]);
    
    distanceWorker.onmessage= function(e){
        //console.log(e.data);
	    return e.data;
        
        distanceWorker.terminate();
	};
}


function insertNewPushPin(obj,markers){
    var id=obj["_id"]["$id"];
    var comments=obj["comments"];
    var severity=obj["severity"];
    var address=obj["address"];
    var date = new Date(obj["time"]*1000);
    //date format
    date=date.toString().substring(0,25);
    var data={"id":id,"comments":comments,"severity":severity,"type":obj.type};    
    
    var cm="";    
    if(comments){
        if(comments.length>1){
            cm="<br /><b>Comments:</b> "+comments;
        }
    }
    
    var opacityClass;
    var colorClass2;
    
    if(reliability<0.35){
        opacityClass = "opHigh";
    } else if(reliability<0.7) {
        opacityClass = "opMed";
    } else {
        opacityClass = "opLow";
    }
    
    if(severityRate=="low"){
        colorClass2 = "bgGreen";
    } else if(severityRate=="medium") {
        colorClass2 = "bgOrange";
    } else {
        colorClass2 = "bgRed";
    }
    
    var other = L.divIcon({className: "markerDiv "+opacityClass+" "+colorClass2+" fa fa-question fa-2x"});
    var traffic = L.divIcon({className: "markerDiv "+opacityClass+" "+colorClass2+" fa fa-road fa-2x"});
    var weather = L.divIcon({className: "markerDiv "+opacityClass+" "+colorClass2+" fa fa-umbrella fa-2x"});
    var festival = L.divIcon({className: "markerDiv "+opacityClass+" "+colorClass2+" fa fa-beer fa-2x"});
    var street_event = L.divIcon({className: "markerDiv "+opacityClass+" "+colorClass2+" fa fa-child fa-2x"});
    var scenery= L.divIcon({className: "markerDiv "+opacityClass+" "+colorClass2+" fa fa-picture-o fa-2x"});
    
    if(map){
        var dist = calculateDistance(obj.reportLatitude,obj.reportLongitude,locationObject.userLatitude,locationObject.userLongitude);
    switch(obj.type){
        case "festival":
            var pushpinOptions = { data:JSON.stringify(data), ic:festival , text:"<div style='border-radius: 2px; background-color: #fafafa; box-shadow: 0 16px 24px 2px rgba(0,0,0,0.14), 0 6px 30px 5px rgba(0,0,0,0.12), 0 8px 10px -5px rgba(0,0,0,0.4); padding: 5px;'><div><center><b>Festival</b></center></div><div style='padding: 5px;'><b>Severity:</b> "+capitalizeFirstLetter(severity)+" "+"<br /><b>On:</b> "+date+"<br /><b>Location:</b> "+address+" ("+dist.toFixed(1)+"km)"+cm+"</div>" ,width: null, height: null, htmlContent: "<div style='font-size:12px;font-weight:bold;border:solid 2px;background-color:LightBlue;width:30px;'><i class='fa fa-beer fa-2x'></i></div></div>"};
            break;
        case "street_event":
            var pushpinOptions = { data:JSON.stringify(data), ic:street_event, text:"<div style='border-radius: 2px; background-color: #fafafa; box-shadow: 0 16px 24px 2px rgba(0,0,0,0.14), 0 6px 30px 5px rgba(0,0,0,0.12), 0 8px 10px -5px rgba(0,0,0,0.4); padding: 5px;'><div><center><b>Street Event</b></center></div><div style='padding: 5px;'><b>Severity:</b> "+capitalizeFirstLetter(severity)+" "+"<br /><b>On:</b> "+date+"<br /><b>Location:</b> "+address+" ("+dist.toFixed(1)+"km)"+cm, width: null, height: null, htmlContent: "<div style='font-size:12px;font-weight:bold;border:solid 2px;background-color:Pink;width:30px;'><i class='fa fa-child fa-2x'></i></div></div>"};
            break;
        case "scenery":
            var pushpinOptions = { data:JSON.stringify(data), ic:scenery, text:"<div style='border-radius: 2px; background-color: #fafafa; box-shadow: 0 16px 24px 2px rgba(0,0,0,0.14), 0 6px 30px 5px rgba(0,0,0,0.12), 0 8px 10px -5px rgba(0,0,0,0.4); padding: 5px;'><div><center><b>Scenery</b></center></div><div style='padding: 5px;'><b>Severity:</b> "+capitalizeFirstLetter(severity)+" "+"<br /><b>On:</b> "+date+"<br /><b>Location:</b> "+address+" ("+dist.toFixed(1)+"km)"+cm, width: null, height: null, htmlContent: "<div style='font-size:12px;font-weight:bold;border:solid 2px;background-color:LightBlue;width:30px;'><i class='fa fa-picture-o fa-2x'></i></div></div>"};
            break;
        case "weather":            
            var pushpinOptions = { data:JSON.stringify(data), ic:weather, text:"<div style='border-radius: 2px; background-color: #fafafa; box-shadow: 0 16px 24px 2px rgba(0,0,0,0.14), 0 6px 30px 5px rgba(0,0,0,0.12), 0 8px 10px -5px rgba(0,0,0,0.4); padding: 5px;'><div><center><b>Weather</b></center></div><div style='padding: 5px;'><b>Severity:</b> "+capitalizeFirstLetter(severity)+" "+"<br /><b>On:</b> "+date+"<br /><b>Location:</b> "+address+" ("+dist.toFixed(1)+"km)"+cm, width: null, height: null, htmlContent: "<div style='font-size:12px;font-weight:bold;border:solid 2px;background-color:Yellow;width:30px;'><i class='fa fa-umbrella fa-2x'></i></div></div>"};
            break;
        case "traffic":            
            var pushpinOptions = { data:JSON.stringify(data), ic:traffic, text:"<div style='border-radius: 2px; background-color: #fafafa; box-shadow: 0 16px 24px 2px rgba(0,0,0,0.14), 0 6px 30px 5px rgba(0,0,0,0.12), 0 8px 10px -5px rgba(0,0,0,0.4); padding: 5px;'><div><center><b>Traffic</b></center></div><div style='padding: 5px;'><b>Severity:</b> "+capitalizeFirstLetter(severity)+" "+"<br /><b>On:</b> "+date+"<br /><b>Location:</b> "+address+" ("+dist.toFixed(1)+"km)"+cm, width: null, height: null, htmlContent: "<div style='font-size:12px;font-weight:bold;border:solid 2px;background-color:Yellow;width:30px;'><i class='fa fa-road fa-2x'></i></div></div>"};
            break;
        case "other":            
            var pushpinOptions = { data:JSON.stringify(data), ic:other, text:"<div style='border-radius: 2px; background-color: #fafafa; box-shadow: 0 16px 24px 2px rgba(0,0,0,0.14), 0 6px 30px 5px rgba(0,0,0,0.12), 0 8px 10px -5px rgba(0,0,0,0.4); padding: 5px;'><div><center><b>Other</b></center></div><div style='padding: 5px;'><b>Severity:</b> "+capitalizeFirstLetter(severity)+" "+"<br /><b>On:</b> "+date+"<br /><b>Location:</b> "+address+" ("+dist.toFixed(1)+"km)"+cm, width: null, height: null, htmlContent: "<div style='font-size:12px;font-weight:bold;border:solid 2px;background-color:Yellow;width:30px;'><i class='fa fa-question fa-2x'></i></div></div>"};
            break;
        default:
            var pushpinOptions = { data:'', ic:'', text:""};
    }
    
    //pushPins.id = new L.marker([obj.reportLatitude, obj.reportLongitude]).addTo(map);
    //pushPins[id] = new L.marker([obj.reportLatitude, obj.reportLongitude],{icon:pushpinOptions.ic,alt:pushpinOptions.data}).bindPopup(pushpinOptions.text).addTo(map);
    //marker = L.marker([obj.reportLatitude, obj.reportLongitude],{icon:pushpinOptions.ic,alt:pushpinOptions.data}).bindPopup(pushpinOptions.text);
    marker = L.marker([obj.reportLatitude, obj.reportLongitude],{icon:pushpinOptions.ic,alt:pushpinOptions.data}).bindPopup(pushpinOptions.text, {maxWidth:200});
    markers.addLayer(marker); //http://jsfiddle.net/9BXL7/
    
    //Add event
    //marker.on('dblclick', displayEventInfo);
    }
}


function displayEventInfo(e){    
    var data=JSON.parse(e.target.options.alt);
    var id=data['id'];
    var comments=data['comments'];
    var severity=data['severity'];
    var type=data['type'];
    
    navigator.notification.prompt(
        "Is this "+type+" report true?",  // message
        function(answer) {
            if (answer.buttonIndex === 1) {
                sendFeedback(id,1);
            }else{
                sendFeedback(id,2);
            }
        },// callback to invoke
        "Information",            // title
        ['Yes','No'],             // buttonLabels
        "Severity: "+severity+", Comments: "+comments                 // defaultText
    );
}


function sendFeedback(evalToSend){
    
    var email=window.localStorage.getItem("email");
    var token=window.localStorage.getItem("token");
    var reportsJudged=JSON.parse(localStorage.getItem("reportsJudged"));
    var url='http://'+server+'/sendFeedback';
    
    freeze = true;
    bootbox.dialog({
        closeButton: false,
        size: 'small',
        message: "<center><img src='img/loading4.gif' class='img-responsive' alt='loading...'/></center><br><center>Sending Feedback..</center>",
        className: modalClass+" heightSmall",
        buttons: {}
    });
    
    function ifServerOnline(ifOnline, ifOffline)
    {
        var img = statusDiv.appendChild(document.createElement("img"));
        img.onload = function()
        {
            ifOnline && ifOnline.constructor == Function && ifOnline();
            //document.body.removeChild(img);
        };
        img.onerror = function()
        {
            ifOffline && ifOffline.constructor == Function && ifOffline();
            //document.body.removeChild(img);
        };
        img.src = "http://"+server+"/offline";        
    }
    
    ifServerOnline(function()
    {   
        setTimeout(function(){
            bootbox.hideAll();
            freeze = false;
            if(debug){
                console.log("online");
            }
            
            for (key in evalToSend){
                reportsJudged.push(evalToSend[key]._id);
                            
                var JSONdata='{"access_token":"'+token+'","userId":"'+email+'","button":"'+evalToSend[key]._button+'","id":"'+evalToSend[key]._id+'"}';
                var ajaxWorker_sendFeedback=new Worker("js/ajax.js");
                ajaxWorker_sendFeedback.postMessage([url,JSONdata]);
                
                ajaxWorker_sendFeedback.onmessage= function(e){
                    showAlertBootbox("Feedback has been sent.","Success");
                    
                    ajaxWorker_sendFeedback.terminate();
                };
            }
        
            reportsJudgedJ=JSON.stringify(reportsJudged);
            localStorage.setItem("reportsJudged",reportsJudgedJ);
                    
            //Reports have been judged
            document.getElementById('inboxNumberOfMessages').innerHTML='';
            document.getElementById('messagesTable').innerHTML='';
        
            //Zero messages should not be presented
            var d=document.getElementById('inboxNumberOfMessages');
            d.className=d.className+" hide";
                        
            //Get the rerort Status for one or more reports
                        
            //----------------GENERATES TROUBLE-------------------
            var iii=JSON.stringify(inboxMessageId);
            setTimeout(function(){getReportStatus(iii);},reportEvaluationPeriod);
                        
            inboxMessageId=[];
            rows=0; 
            
        }, 2000);
    },
    function ()
    {
        setTimeout(function(){
            bootbox.hideAll();
            freeze = false;
            if(debug){
                console.log("offline");
            }
            
            showAlertBootbox("Error connecting to the server. Please try again.","Error");
            
        }, 2000);
    });
}


// process the promp dialog results
function onPrompt(results) {
    alertify.alert("You selected button number " + results.buttonIndex + " and entered " + results.input1);
}


// Show a custom prompt dialog
//
function showPrompt(message,title,text,buttonNames,callBack) {
    title = typeof title !== 'undefined' ? title : "Send a report?";
    buttonNames = typeof buttonNames !== 'undefined' ? buttonNames : ['Cancel','Ok'];    
    text = typeof text !== 'undefined' ? text : "Comments";
    callBack = typeof callBack !== 'undefined' ? callBack : onPromptReport;
    
    navigator.notification.prompt(
        message,  // message
        callBack,                  // callback to invoke
        title,            // title
        buttonNames,             // buttonLabels
        text                 // defaultText
    );
}


function reportPrompt(){
    /*THis function sends reports using the prompt method*/
    reportObject=locationObject;
    l=map.getCenter();
    reportObject["reportLatitude"]=  l.lat;
    reportObject["reportLongitude"]=  l.lng;
    reportObject["mode"]= mode;
    reportObject["time"]= Math.floor(Date.now()/1000);
    
    var address="The address has not been retrieved yet.";//"Error in retrieving address";
    findAddress((function(result1,result2,result3){
        if(result2 && result3){
            address=result2+" "+result3;
        }else if(result1){
            address=" the area of "+result1;    
        }
    }));
    
    /* var message="send a report";
    var title="send Report";
    var text="Comments";
    var buttonNames=['Accident','Congestion','Danger'];
    showPrompt(message,title,text,buttonNames,onPromptReport);
    */
    //var html=document.getElementById('report').innerHTML;
    
    var reportHTML=
          //'<input type="radio"
                    //==========================================================================================================================
                '<b>Severity:</b> '+
                '<div class="navigation-bar">'+
                  '<div class="navigation-bar__center">'+
                    '<div class="button-bar" style="width:200px">'+
                      '<div class="button-bar__item">'+
                        '<input type="radio" name="severity" id="severity1" value="low">'+
                        '<div class="button-bar__button">Low</div>'+
                      '</div>'+
                
                      '<div class="button-bar__item">'+
                        '<input type="radio" name="severity" id="severity2" value="medium" checked="checked">'+
                        '<div class="button-bar__button">Medium</div>'+
                      '</div>'+
                      
                      '<div class="button-bar__item">'+
                        '<input type="radio" name="severity" id="severity3" value="high">'+
                        '<div class="button-bar__button">High</div>'+
                      '</div>'+
                    '</div>'+
                  '</div>'+
                '</div>'+
                
                //==========================================================================================================================
                
                
                      
          
      //'Severity: '+
      //'<div class="radio-inline">'+
      //'<input type="radio" name="severity" id="severity1" value="low">Low'+
      //'</div>    '+
      //'<div class="radio-inline">'+
      //'<input type="radio" name="severity" id="severity2" value="medium" checked="checked">Medium'+
      //'</div>'+
      //'<div class="radio-inline">'+
      //'<input type="radio" name="severity" id="severity3" value="high">High'+
      //'</div>'+ 
      '<b>Type:</b>'+
             //==========================================================================================================================
                //'<ul class="list">'+
                //  '<li class="list__item list__item--tappable">'+
                    '<label class="radio-button radio-button--list-item">'+
                      '<input type="radio" name="type" id="radioFestival" value="festival" checked="checked">'+
                      '<div class="radio-button__checkmark radio-button--list-item__checkmark"></div>'+
                      '&nbsp;Festival'+
                    '</label>'+
                //  '</li>'+
                //  '<li class="list__item list__item--tappable">'+
                    '<label class="radio-button radio-button--list-item">'+
                      '<input type="radio" name="type" id="radioStreetEvent" value="street_event">'+
                      '<div class="radio-button__checkmark radio-button--list-item__checkmark"></div>'+
                      '&nbsp;Street Event'+
                    '</label>'+
                //  '</li>'+
                //  '<li class="list__item list__item--tappable">'+
                    '<label class="radio-button radio-button--list-item">'+
                      '<input type="radio" name="type" id="radioScenery" value="scenery">'+
                      '<div class="radio-button__checkmark radio-button--list-item__checkmark"></div>'+
                      '&nbsp;Scenery'+
                    '</label>'+
                //  '</li>'+
                //  '<li class="list__item list__item--tappable">'+
                    '<label class="radio-button radio-button--list-item">'+
                      '<input type="radio" name="type" id="radioWeather" value="weather">'+
                      '<div class="radio-button__checkmark radio-button--list-item__checkmark"></div>'+
                      '&nbsp;Weather'+
                    '</label>'+
                    '<label class="radio-button radio-button--list-item">'+
                      '<input type="radio" name="type" id="radioTraffic" value="traffic">'+
                      '<div class="radio-button__checkmark radio-button--list-item__checkmark"></div>'+
                      '&nbsp;Traffic'+
                    '</label>'+
                    '<label class="radio-button radio-button--list-item">'+
                      '<input type="radio" name="type" id="radioOther" value="other">'+
                      '<div class="radio-button__checkmark radio-button--list-item__checkmark"></div>'+
                      '&nbsp;Other'+
                    '</label>'+
                //  '</li>'+
                //'</ul>'+
                
                
                
                //==========================================================================================================================
                
                
      
      //'<input type="radio" name="type" id="radioAccident" value="accident">Accident'+
      
      //'</div>'+
      //'<div class="radio col-xs-offset-1">'+
      
      //'<input type="radio" name="type" id="radioTraffic" value="traffic" checked="checked">Traffic'+
      
      //'</div>'+
      //'<div class="radio col-xs-offset-1">'+
      
      //'<input type="radio" name="type" id="radioWorks" value="works">Works'+
      
      //'</div>'+ 
      //'<div class="radio col-xs-offset-1">'+
      
      //'<input type="radio" name="type" id="radioWeather" value="weather">Weather'+
      
    '<hr style="margin-bottom: 3px; margin-top: 2px;">'+
    '<b>Comments:</b>'+

    '<input class="form-control" id="comments" name="comments" type="text" placeholder="optional (required for type Other)" maxlength="160">';

    //'<div align="right" style="font-size:80%; margin-top: 5pt;"><b><i class="fa fa-exclamation-triangle">Our system ensures user anonymity</b></div>';
  
    if(!freeze){
        freeze=true;  
        bootbox.dialog({
            closeButton: false,
            title: "<center><b>Report Details</b></center>",
            message: reportHTML,
            className: modalClass,
            buttons: {
                success: {
                    label: "<i class='fa fa-send'></i> Send",
                    className: "btn-success",
                    callback: function () {
                        var severity=null;
                        severity=$("input[name='severity']:checked").val();                       
                            
                        //var comments=document.getElementById("comments").value;
                        //document.getElementById("comments").value="";
                        //console.log(comments);
                        var comments=$("#comments").val();                            
                            
                        var cm="";
                        if(comments.length>2){
                            cm="<br /> <b>Comments:</b> "+comments;
                        }   
                            
                        reportObject['severity']=severity;
                        reportObject['comments']=comments;
                            
                        var type=$("input[name='type']:checked").val();
                        reportObject['type']=type;
                        //console.log(comments+severity+type);
                            
                            
                        //report confirmation
                        //var reportText=severity+" "+type+cm+"<br /> at "+address+" ?";
                        storedAddress = address;
                        
                        if(type=="other" && cm==""){
                            bootbox.dialog({
                                closeButton: false,
                                title: "<center><b>Warning</b></center>",
                                message: "Submiting a report of type 'Other' requires comments!",
                                buttons: {
                                    success: {
                                        label: "<i class='fa fa-reply'></i> Retry",
                                        className: "btn-success",
                                        callback: function () {
                                            freeze=false;  
                                            reportPrompt();
                                        }
                                    }
                                }
                            });
                            
                        }else{
                            var reportText="<b>Type:</b> "+capitalizeFirstLetter(type)+"<br /><b>Severity:</b> "+capitalizeFirstLetter(severity)+"<br /><b>Location:</b> "+address+cm;
                            bootbox.dialog({
                                closeButton: false,
                                title: "Please confirm report submission",
                                message: reportText,
                                className: modalClass,
                                buttons: {
                                    success: { 
                                        label: "<i class='fa fa-send'></i> Send",
                                        className: "btn-success",
                                        callback: function () {
                                            sendReport();
                                            freeze=false;   
                                        }
                                    },cancel:{
                                        label: "Cancel",
                                        className: "btn-default",
                                        callback: function () {
                                            bootbox.hideAll();
                                            freeze=false;
                                        }
                                    }
                                }            
                            });
                        }
                    }
                },cancel:{
                    label: "Cancel",
                    className: "btn-default",
                    callback: function () {
                        bootbox.hideAll();
                        freeze=false;
                    }
                }
            }
        });
    }//freeze        
}


function onPromptReport(results){
    switch (results.buttonIndex){
        case 1:
            locationObject["type"]="accident"; 
            break;
        case 2:
            locationObject["type"]="Congestion"; 
            break;
        case 3:
            locationObject["type"]="Danger"; 
            break;
        }
    locationObject["comments"]=results.input1;
    sendReport();
}


function getReportValues(){
    var severity=null;
    if (document.getElementById('severity1').checked) {
        severity="low";
    }
        if (document.getElementById('severity2').checked) {
        severity="medium";
    }
        if (document.getElementById('severity3').checked) {
        severity="high";
    }

    var comments=document.getElementById("comments").value;
    document.getElementById("comments").value="";
    
    locationObject['severity']=severity;
    locationObject['comments']=comments;
    
}


function onChangeSettings(){
    nearDistance=document.getElementById("nearDistance").value;
    nearDistanceOfNots=document.getElementById("nearDistanceOfNots").value;
    loadReportsTime=document.getElementById("loadReportsTime").value;
    //server=document.getElementById("inputServer").value;
    
    if (document.getElementById('mode1').checked) {
        mode="drive";
    }
    if (document.getElementById('mode2').checked) {
        mode="walk";       
    }
    if (document.getElementById('mode3').checked) {
        mode="transportation";       
    }
    if (document.getElementById('mode4').checked) {
        mode="cycling";       
    }
        
    if(document.getElementById('showNotificationForIncomingReport').checked){
        showNotificationForIncomingReport=true;
    }else{
            showNotificationForIncomingReport=false;
    }
 
    window.localStorage.setItem("mode", mode);
    window.localStorage.setItem("nearDistance", nearDistance);
    window.localStorage.setItem("nearDistanceOfNots", nearDistanceOfNots);
    window.localStorage.setItem("loadReportsTime", loadReportsTime);
    window.localStorage.setItem("showNotificationForIncomingReport", showNotificationForIncomingReport);
    //window.localStorage.setItem("server", server);
}


function changeSettings(){   
    
    
    var mode1=" ";
    var mode2=" ";
    var mode3=" ";
    var mode4=" ";
    
    switch(mode){
        case "drive":
            mode1="checked='checked'";       
            break;
        case "walk":
            mode2="checked='checked'";       
            break;
        case "transportation":
            mode3="checked='checked'";       
            break;
        case "cycling":
            mode4="checked='checked'";       
            break;        
    }
    
    //console.log(mode1+"-"+mode2+"-"+mode3+"-"+mode4);
    
    if(backround==="black"){
        var backround1="checked='checked'"
        var backround2="";
    }else{
        var backround2="checked='checked'"
        var backround1="";
    }
    //document.getElementById("nearDistance").value=nearDistance;
    //document.getElementById("loadReportsTime").value=loadReportsTime;
    //document.getElementById("inputServer").value=server;
        
    if(showNotificationForIncomingReport==="true"){
        showNotificationForIncomingReportTF="checked='checked'";
    }else{
        showNotificationForIncomingReportTF="";
    }                
       
    if(showSelfReports==="true"){
        showSelfReportsTF="checked='checked'";
    }else{
        showSelfReportsTF="";
    }
    
    if(soundForIncomingReport==="true"){
        soundForIncomingReportTF="checked='checked'";
    }else{
        soundForIncomingReportTF="";
    }
    
    //if(vibrationForIncomingReport==="true"){
    //    vibrationForIncomingReportTF="checked='checked'";
    //}else{
    //    vibrationForIncomingReportTF="";
    //}
        
    if(!freeze){
        freeze=true;
    
        hideReportButton();
        bootbox.dialog({
            closeButton: false,
            title: "<center><b>Change Settings</b></center>",
            message: '<div class="row"><div class="col-xs-12 ">'+
                'Mode:'+
                
                //==========================================================================================================================
                /*'<div class="navigation-bar">'+
                  '<div class="navigation-bar__center">'+
                    '<div class="button-bar" style="width:200px">'+
                      '<div class="button-bar__item">'+
                        '<input type="radio" name="severity" id="mode1" '+mode1+' value="drive">'+
                        '<div class="button-bar__button">Drive</div>'+
                      '</div>'+
                
                      '<div class="button-bar__item">'+
                        '<input type="radio" name="severity" id="mode2" '+mode2+'  value="walk">'+
                        '<div class="button-bar__button">Walk</div>'+
                      '</div>'+
                    '</div>'+
                  '</div>'+
                '</div>'+
                */
                
                
                //'<ul class="list">'+
                //  '<li class="list__item list__item--tappable">'+
                '<div>'+
                    '<label class="radio-button radio-button--list-item">'+
                      '<input type="radio" name="md" id="md1" '+mode1+' value="drive">'+
                      '<div class="radio-button__checkmark radio-button--list-item__checkmark"></div>'+
                      '&nbsp;Drive'+
                    '</label>'+
                //  '</li>'+
                //  '<li class="list__item list__item--tappable">'+
                    '<label class="radio-button radio-button--list-item">'+
                      '<input type="radio" name="md" id="md2" '+mode2+'  value="walk">'+
                      '<div class="radio-button__checkmark radio-button--list-item__checkmark"></div>'+
                      '&nbsp;Walk'+
                    '</label>'+
                //  '</li>'+
                //  '<li class="list__item list__item--tappable">'+
                    '<label class="radio-button radio-button--list-item">'+
                      '<input type="radio" name="md" id="md3" '+mode3+'  value="transportation">'+
                      '<div class="radio-button__checkmark radio-button--list-item__checkmark"></div>'+
                      '&nbsp;Transportation'+
                    '</label>'+
                    '<label class="radio-button radio-button--list-item">'+
                      '<input type="radio" name="md" id="md4" '+mode4+'  value="cycling">'+
                      '<div class="radio-button__checkmark radio-button--list-item__checkmark"></div>'+
                      '&nbsp;Cycle'+
                    '</label>'+
                //  '</li>'+
                //  '<li class="list__item list__item--tappable">'+
                //    '<label class="radio-button radio-button--list-item">'+
                //      '<input type="radio" name="modes" id="mode4" '+mode4+'  value="cycling">'+
                //      '<div class="radio-button__checkmark radio-button--list-item__checkmark"></div>'+
                //      '&nbsp;Cycling'+
                 //   '</label>'+
                //  '</li>'+
                //'</ul>'+
                '</div>'+
                //==========================================================================================================================
                /*'Traffic time interval (minutes):'+
                '<div style="width: 100%;">'+
                    '<input type="range" id="myRange" value="0" max="15" min="-15" step="5">'+
                    '<div style="font-size: 80%; display: table; table-layout: fixed; width: 100%;">'+
                          '<div style="display: table-cell; text-align: center;">-15m</div>'+
                          '<div style="display: table-cell; text-align: center;">-10m</div>'+
                          '<div style="display: table-cell; text-align: center;">-5m</div>'+
                          '<div style="display: table-cell; text-align: center;">now</div>'+
                          '<div style="display: table-cell; text-align: center;">+5m</div>'+
                          '<div style="display: table-cell; text-align: center;">+10m</div>'+
                          '<div style="display: table-cell; text-align: center;">+15m</div>'+
                    '</div>'+
                '</div>'+*/
                
                'Background color:'+
                 '<div class="navigation-bar">'+
                  '<div class="navigation-bar__center">'+
                    '<div class="button-bar" style="width:200px">'+
                      '<div class="button-bar__item">'+
                        '<input type="radio" name="backround" id="backround1" '+backround1+' value="black">'+
                        '<div class="button-bar__button">Black</div>'+
                      '</div>'+
                
                      '<div class="button-bar__item">'+
                        '<input type="radio" name="backround" id="backround2" '+backround2+'  value="white">'+
                        '<div class="button-bar__button">White</div>'+
                      '</div>'+
                    '</div>'+
                  '</div>'+
                '</div>'+
                
                //'<div class="radio-inline">'+
                //'<input type="radio" name="severity" id="mode1" '+mode1+' value="drive">Drive'+
                //'</div>'+
                //'<div class="radio-inline">'+
                //'<input type="radio" name="severity" id="mode2" '+mode2+'  value="walk">Walk'+
                //'</div>'+
                '</div>'+
                '</div>'+
                '<div class="row">'+
                '<div class="col-xs-12 ">'+
                'Near distance of reports on map (km):'+
                '<input type="text" class="form-control" id="nearDistance" maxlength="3" placeholder="Distance (km)" value="'+nearDistance+'" style="margin-bottom: 4px;">'+
                '</div>'+
                '</div>'+
                '<div class="row">'+
                '<div class="col-xs-12 ">'+
                'Near distance of notifications (km):'+
                '<input type="text" class="form-control" id="nearDistanceOfNots" maxlength="2" placeholder="Distance (km)" value="'+nearDistanceOfNots+'" style="margin-bottom: 4px;">'+
                '</div>'+
                '</div>'+
                '<div class="row">'+
                '<div class="col-xs-12 ">'+
                'Reports Time (minutes):'+
                '<input type="text" class="form-control" id="loadReportsTime" maxlength="5" placeholder="Time (minutes)" value="'+loadReportsTime+'" style="margin-bottom: 4px;">'+
                '</div>'+
                '</div>'+  
                //'<div class="row">'+
                //'<div class="col-xs-12">'+
                //'Server (change only if necessary):'+
                //'</div>'+
                //'</div>'+
                //'<div class="row">'+
                //'<div class="col-xs-12">'+
		        //'<input type="text" class="form-control" id="inputServer" maxlength="40" placeholder="Server" value="'+server+'" style="margin-bottom: 4px;">'+
                //'<button type="button" class="btn-xs" style="float: right; background-color: rgba(207, 12, 12, 0.81); color: white" onclick="resetServer()">Default Server</button>'+
                //'</div>'+
                //'</div>'+
                '<div class="row">'+
                '<div class="col-xs-12">'+
                
                //==========================================================================================================================
                
                //'<ul class="list">'+
                //  '<li class="list__item list__item--tappable">'+
                    '<label class="checkbox checkbox--list-item">'+
                      '<input type="checkbox" id="showNotificationForIncomingReport" '+showNotificationForIncomingReportTF+' >'+
                      '<div class="checkbox__checkmark checkbox--list-item__checkmark"></div>'+
                      '&nbspShow notifications'+
                    '</label>'+
                //  '</li>'+
                //  '<li class="list__item list__item--tappable">'+
                    '<label class="checkbox checkbox--list-item">'+
                      '<input type="checkbox" id="showSelfReports" '+showSelfReportsTF+' >'+
                      '<div class="checkbox__checkmark checkbox--list-item__checkmark"></div>'+
                      '&nbspShow my reports'+
                    '</label>'+
                //  '</li>'+
                //'</ul>'+
                '</div>'+
                '</div>'+
                
                '<div class="row">'+
                '<div class="col-xs-12">'+
                
                //'<ul class="list">'+
                //  '<li class="list__item list__item--tappable">'+
                    '<label class="checkbox checkbox--list-item">'+
                      '<input type="checkbox" id="soundForIncomingReport" '+soundForIncomingReportTF+' >'+
                      '<div class="checkbox__checkmark checkbox--list-item__checkmark"></div>'+
                      '&nbspNotification Sound'+
                    '</label>'+
                //  '</li>'+
                //  '<li class="list__item list__item--tappable">'+
                //    '<label class="checkbox checkbox--list-item">'+
                //      '<input type="checkbox" id="vibrationForIncomingReport" '+vibrationForIncomingReportTF+' >'+
                //      '<div class="checkbox__checkmark checkbox--list-item__checkmark"></div>'+
                //      '&nbspVibration'+
                //    '</label>'+
                //  '</li>'+
                //'</ul>'+
                
                //==========================================================================================================================
                
                
                
		        //'<div class="checkbox">'+
		        
		        //'<input type="checkbox" id="showNotificationForIncomingReport" '+showNotificationForIncomingReportTF+' > Show notifications'+
		        
		        //'</div>'+
	            '</div>'+
                '</div>',
                //'<div class="row">'+
                //'<div class="col-xs-11 col-xs-offset-1">'+
    	        //'<div class="checkbox">'+
		        
		        //'<input type="checkbox" id="showSelfReports" '+showSelfReportsTF+' > Show my reports'+
		        
		        //'</div>'+
	            //'</div>'+
                //'</div>',
            className: modalClass,
            buttons: {
                success: {
                    label: "Save",
                    className: "btn-success",
                    callback: function () {
                        var nearDistanceF=document.getElementById("nearDistance").value;
                        var nearDistanceOfNotsF=document.getElementById("nearDistanceOfNots").value;
                        var loadReportsTimeF=document.getElementById("loadReportsTime").value;
                        //var serverF=document.getElementById("inputServer").value;
                            
                        if (document.getElementById('md1').checked) {
                            var modeF="drive";         
                        }
                        if (document.getElementById('md2').checked) {
                            var modeF="walk";        
                        }
                        if (document.getElementById('md3').checked) {
                            var modeF="transportation";        
                        }
                        if (document.getElementById('md4').checked) {
                            var modeF="cycling";        
                        }
                        if (document.getElementById('backround1').checked) {
                            var backroundF="black";         
                        }
                        if (document.getElementById('backround2').checked) {
                            var backroundF="white";        
                        }
                        if ($("input[id='showNotificationForIncomingReport']:checked").val()==="on") {
                            var showNotificationForIncomingReportF="true";        
                        }else{
                            var showNotificationForIncomingReportF="false";        
                        }
                        if ($("input[id='showSelfReports']:checked").val()==="on") {
                            var showSelfReportsF="true";        
                        }else{
                            var showSelfReportsF="false";        
                        }
                        if ($("input[id='soundForIncomingReport']:checked").val()==="on") {
                            var soundForIncomingReportF="true";        
                        }else{
                            var soundForIncomingReportF="false";        
                        }    
                        //if ($("input[id='vibrationForIncomingReport']:checked").val()==="on") {
                        //    var vibrationForIncomingReportF="true";        
                        //}else{
                        //    var vibrationForIncomingReportF="false";        
                        //}
                            
                        if(nearDistanceF !== nearDistance){
                            var ckeck=true;        
                        }else if(nearDistanceOfNotsF !== nearDistanceOfNots){
                            var ckeck=true;        
                        }else if(loadReportsTimeF !== loadReportsTime){
                            var ckeck=true;        
                        }else if(modeF !== mode){
                            var ckeck=true;        
                        }else if( showNotificationForIncomingReportF !== showNotificationForIncomingReport){
                            var ckeck=true;        
                        //}else if( serverF !== server){
                        //    var ckeck=true;
                        }else if( showSelfReportsF !== showSelfReports){
                            var ckeck=true;
                        }else if( soundForIncomingReportF !== soundForIncomingReport){
                            var ckeck=true;
                        //}else if( vibrationForIncomingReportF !== vibrationForIncomingReport){
                        //    var ckeck=true;
                        }else{
                            var check=false;
                        }
                            
                        //console.log(nearDistanceF+"->"+nearDistance);
                        //console.log(check);
                            
                        //Limit Load Reports Time
                        if(loadReportsTimeF>loadReportsTimeLimit){        
                            loadReportsTimeF=loadReportsTimeLimit;
                        }
    
                        //Limit near Distance of Notifications
                        if(nearDistanceF>nearDistanceLimit){
                            nearDistanceF=nearDistanceLimit;
                        }

    
                        //Limit near Distance of Notifications
                        if(nearDistanceOfNotsF>nearDistanceOfNotsLimit){
                            nearDistanceOfNotsF=nearDistanceOfNotsLimit;
                        }


                        window.localStorage.setItem("mode", modeF);
                        window.localStorage.setItem("nearDistance", nearDistanceF);
                        window.localStorage.setItem("backround", backroundF);
                        window.localStorage.setItem("nearDistanceOfNots", nearDistanceOfNotsF);
                        window.localStorage.setItem("loadReportsTime", loadReportsTimeF);
                        window.localStorage.setItem("showNotificationForIncomingReport", showNotificationForIncomingReportF);
                        window.localStorage.setItem("showSelfReports", showSelfReportsF);
                        //window.localStorage.setItem("server", serverF);
                        window.localStorage.setItem("soundForIncomingReport", soundForIncomingReportF);
                        //window.localStorage.setItem("vibrationForIncomingReport", vibrationForIncomingReportF);
                            
                        location.reload();  
                            
                            
                        var b=document.getElementsByClassName("navbar-toggle");
                        b[0].click();
                        freeze=false;
                        showReportButton();
                    }
                },cancel:{
                    label: "Cancel",
                    className: "btn-default",
                    callback: function () {
                        bootbox.hideAll();
                        freeze=false;
                        showReportButton();
                    }
                }
            }
        });
    }
    //var b=document.getElementsByClassName("navbar-toggle");
    //b[0].click();
}


/*function checkWalkRadius(){
    if(document.getElementById('nearDistance').value>walkRadius){
        document.getElementById('nearDistance').value=walkRadius;
        showAlertBootbox("In walk mode, the maximum distance is set to: "+walkRadius,"Notice");
    }
}*/
   
   
function showTarget(){
    $("#mainPage").append("<div id='target'></div>");
}


function deletePushpins(){
    for(var i=map.entities.getLength()-1;i>=0;i--) {
        var pushpin= map.entities.get(i); 
        if (pushpin instanceof Microsoft.Maps.Pushpin) { 
            map.entities.removeAt(i);  
        };
    }
}


function findAddress(callback,x,y){
    x = typeof x !== 'undefined' ? x : locationObject.reportLatitude;
    y = typeof y !== 'undefined' ? y : locationObject.reportLongitude;    
    
    //var url="http://dev.virtualearth.net/REST/v1/Locations/"+x+","+y+"&output=json&jsonp=GeocodeCallback&key=AuPcHmxjgV3j0Iy9BUHro1xFGXQ7OW0angPpZ3zvBx2UTweLPUDVBKTHdRBndWYL";
    var url="http://dev.virtualearth.net/REST/v1/Locations/"+x+","+y+"?o=json&includeEntityTypes=Address&key=AuPcHmxjgV3j0Iy9BUHro1xFGXQ7OW0angPpZ3zvBx2UTweLPUDVBKTHdRBndWYL";
    $.ajax({
        url: url,
        type:'GET',
        success: function(data) {            
            var j=data.resourceSets;            
            //console.log(j[0].resources[4].name);
            //result=j[0].resources[4].name;
            
            //Avoiding errors..
            if(typeof j[0].resources[0] === 'undefined'){
                //findAddress(callback,x,y)
            };
            
            if(j[0].resources[0]){
                result1=j[0].resources[0].address.formattedAddress;
                result2=j[0].resources[0].address.addressLine;
                result3=j[0].resources[0].address.locality;
                callback(result1,result2,result3);
            }
            //return j[0].resources[4].name;            
        },
        error: function(data){
            //console.log("error");
            result="Error on getting the address";
            callback(result);
            //return "Error getting the address";
        }        
    });
}


function sendReportWithAddress(result){
    showAlert('Report '+locationObject.type+' has been sent, for the address: '+result);
}


function loadReportButton(){
    document.getElementById('reportButtons').className="";
}


function unloadLoadingGif(){
    document.getElementById("loader").innerHTML="";
}


function checkSettingsFormChange(){
    //form values
    var nearDistanceF=document.getElementById("nearDistance").value;
    var nearDistanceOfNotsF=document.getElementById("nearDistanceOfNots").value;
    var loadReportsTimeF=document.getElementById("loadReportsTime").value;
    //var serverF=document.getElementById("inputServer").value;
        
    if (document.getElementById('mode1').checked) {
        var modeF="drive";         
    }
    if (document.getElementById('mode2').checked) {
        var modeF="walk";        
    }
    if (document.getElementById('mode3').checked) {
        var modeF="transportation";        
    }
    if (document.getElementById('mode4').checked) {
        var modeF="cycling";        
    }
    if (document.getElementById('showNotificationForIncomingReport').checked) {
        var showNotificationForIncomingReportF=true;        
    }else{
        showNotificationForIncomingReportF=false;        
    }
    
    if(nearDistanceF!==nearDistance){
        return true;        
    }else if(nearDistanceOfNotsF!==nearDistanceOfNots){
        return true;        
    }else if(loadReportsTimeF !== loadReportsTime){
        return true;        
    }else if(modeF !== mode){
        return true;        
    }else if( showNotificationForIncomingReportF !== showNotificationForIncomingReport){
        return true;        
    //}else if( serverF !== server){
    //    return true;        
    }else{
        return false;
    }
}



function messages(){
    
    var html=document.getElementById('messagesDiv').innerHTML;
    var d=document.getElementById('inboxNumberOfMessages').innerHTML;
    var buttons= {
        success: {
            label: "<i class='fa fa-check'></i> Submit",
            className: "btn-success",
            callback: function () {
                var evalToSend = [];
                            
                for (key in inboxMessageId){
                    var id = inboxMessageId[key];
                    var button= $("input[name='"+id+"']:checked").val();
                    evalToSend.push({_id:id, _button:button});
                    //reportsJudged.push(id);
                }
                sendFeedback(evalToSend);
                
            }
        },cancel:{
            label: "Cancel",
            className: "btn-default",
            callback: function () {
                bootbox.hideAll();
                freeze=false;
            }
        }
    };
    if(d==''){
        html="There are no reports to evaluate.";
        buttons={
            success: {
                label: "Ok",
                className: "btn-success",
                callback: function () {
                    bootbox.hideAll();
                    freeze=false;
                }
            }
        }
    }
    if(!freeze){
        freeze=true;
        bootbox.dialog({
            closeButton: false,
            title: "<center><b>Reports to Evaluate</b></center>",
            message: html,
            className: modalClass,
            //if(d){
            buttons: buttons
        });
    }
}


function insertNewMessage(obj){
    var id=obj["_id"]["$id"]; 
    var type=obj.type;
    var address=obj.address;
    var date = new Date(obj["time"]*1000);
    date=date.toString().substring(0,25);
    var reporterId=obj.userId;
    var userId=window.localStorage.getItem("email");
    var comments=obj.comments;
    var severity=obj.severity;
     
    var cm="";
    if(comments.length>2){
        cm="<br /> Comments: "+comments;
    }   
                                                
    var reportText="Type: "+capitalizeFirstLetter(type)+"<br />Severity: "+capitalizeFirstLetter(severity)+"<br />Location: "+address+cm;

    if(reporterId !== userId){
        //obj.reportLatitude, obj.reportLongitude
        if(inboxMessageId.indexOf(id)===-1 && reportHasBeenJudgedBefore(id)===false){
        //=====================================================================================================================================//
            var newHtml=                //'<div class="navigation-bar">'+
                  //'<div class="navigation-bar__center">'+
                    '<div class="button-bar" >'+
                      '<div class="button-bar__item">'+
                        '<input type="radio" name="'+id+'" id="1_'+id+'" checked="checked" value="1">'+
                        '<div class="button-bar__button">True</div>'+
                      '</div>'+
                
                      '<div class="button-bar__item">'+
                        '<input type="radio" name="'+id+'" id="2_'+id+'" value="2">'+
                        '<div class="button-bar__button">False</div>'+
                      '</div>'+
                      
                      '<div class="button-bar__item">'+
                        '<input type="radio" name="'+id+'" id="3_'+id+'" value="3">'+
                        "<div class='button-bar__button'>Don't know</div>"+
                      '</div>'+
                    '</div>';
                  //'</div>'+
                //'</div>';
                
            var html="<tr class='"+id+"'><td>"+reportText+"<br /></td></tr><tr class='"+id+"'><td>"+newHtml+"</td></tr>";
            //var html="<tr class='"+id+"'><td>"+reportText+"<br /></td></tr><tr class='"+id+"'><td> <div class='radio-inline'><input type='radio' name='"+id+"' id='1_"+id+"' checked='checked' value='1'>True</div><div class='radio-inline'>  <input type='radio'  name='"+id+"' id='2_"+id+"' value='2'>False</div><div class='radio-inline'>  <input type='radio'  name='"+id+"' id='3_"+id+"' value='3'>Don't know</div></td></tr>";
         
            //=====================================================================================================================================//

            //document.getElementById('messagesDiv').innerHTML=html;
            var table=document.getElementById('messagesTable');
            var row = table.insertRow(0);
            var cell1 = row.insertCell(0);
            cell1.innerHTML = html;
            rows=rows+1;
            document.getElementById('inboxNumberOfMessages').innerHTML=rows;
            document.getElementById('inboxNumberOfMessages').className="label label-danger";
    
            /*SLOWS DOWN AND CREATES ERRORS*/
            //     findAddress(function(result){
            //         document.getElementById('address_'+id).innerHTML=result;
            //     },obj.reportLatitude, obj.reportLongitude);
                 
            inboxMessageId.push(id);
        }
    }
}



function getResponseButtonFromRadio(id){
    var x = document.getElementById("1_"+id).checked;
    var y = document.getElementById("2_"+id).checked;
    if(x){
        return "1";
    }else if(y){
        return "2";
    }
}

function reportHasBeenJudgedBefore(id){
    var reportsJudged=JSON.parse(localStorage.getItem("reportsJudged"));
    if(reportsJudged){
        if (reportsJudged.indexOf(id)===-1){
            return false;
        }else{
            return true;
        }
    }
}

function showUserCredits(){
    
    var token=window.localStorage.getItem("token");
    var email=window.localStorage.getItem("email");      
    var url='http://'+server+'/getCredits';
    var JSONdata='{"access_token":"'+token+'","userId":"'+email+'"}';
    
    if(!freeze){
        freeze = true;
        bootbox.dialog({
            closeButton: false,
            size: 'small',
            message: "<center><img src='img/loading4.gif' class='img-responsive' alt='loading...'/></center><br><center>Fetching User Credits..</center>",
            className: modalClass+" heightSmall",
            buttons: {}
        });
        
        function ifServerOnline(ifOnline, ifOffline)
        {
            var img = statusDiv.appendChild(document.createElement("img"));
            img.onload = function()
            {
                ifOnline && ifOnline.constructor == Function && ifOnline();
                //document.body.removeChild(img);
            };
            img.onerror = function()
            {
                ifOffline && ifOffline.constructor == Function && ifOffline();
                //document.body.removeChild(img);
            };
            img.src = "http://"+server+"/offline";        
        }
        
        ifServerOnline(function()
        {   
            setTimeout(function(){
                bootbox.hideAll();
                freeze = false;
                if(debug){
                    console.log("online");
                }
                var ajaxWorker_getCredits=new Worker("js/ajax.js");
                ajaxWorker_getCredits.postMessage([url,JSONdata]);
                
                ajaxWorker_getCredits.onmessage= function(e){
                    var t=JSON.parse(e.data);
                    if(t){
                        
                        console.log(JSON.stringify(t))
                        if(t.data){
                            credits=t.data[0].credits;
                            trustLevel=t.data[0].TrustLevel;
                        }
            
                        var stats=0;
                        if(t.stats){
                            stats=JSON.stringify(t.stats.false);
                        }
                        //console.log(stats);
                        var medal = evaluateCredits(stats,credits.sentReport,credits.sentFeedback);
                        
                        var text= creditsToText(credits,trustLevel,medal);
                        
                        document.getElementById("creditsData").innerHTML=text;
                        if(!freeze){
                            freeze=true;
                            bootbox.dialog({
                                className: modalClass,
                                closeButton: false,
                                title: "<center><b>User Credits</b></center>",
                                message: text,
                                buttons: {
                                    success: { 
                                        label: "Ok",
                                        className: "btn-success",
                                        callback: function () {
                                            bootbox.hideAll();
                                            freeze=false;
                                        }
                                    }
                                }
                            });
                        }
                    }else{
                        showAlertBootbox("Error connecting to the server","Error");
                    }                
                //    var b=document.getElementsByClassName("navbar-toggle");
                //    b[0].click();
                    ajaxWorker_getCredits.terminate();
                }
            }, 2000);
        },
        function ()
        {
            setTimeout(function(){
                bootbox.hideAll();
                freeze = false;
                if(debug){
                    console.log("offline");
                }
                
                showAlertBootbox("Error connecting to the server. Please try again.","Error");
            
            }, 2000);
        });
    }//freeze
}



function creditsToText(credits,trustLevel,medal){
	var key;
	var sentReport=credits.sentReport;
	var sentFeedback=credits.sentFeedback;
    
	var text="<p><b>Trust Level: </b>"+(trustLevel*100)+"%</p><table class='table table-condensed'><th></th><th>Reports sent*</th><th>Feedback sent</th>";
    	for (key in sentReport){
        
        if(!sentReport[key]){
            sentReport[key]="0";
        }
        if(!sentFeedback[key]){
            sentFeedback[key]="0";
        }
            
    	text +="<tr><td>"+capitalizeFirstLetter(key)+"</td><td>"+sentReport[key]+"</td><td>"+sentFeedback[key]+"</td></tr>";
    	//console.log(key+"=>"+sentReport[key]);	
	}
    
    var ms = "";
    
    if(medal=="bronze"){
        ms = "&nbsp;&nbsp;<b>Bronze User</b><br><p style='font-size:80%'> Make your community a better place! Keep sending or evaluating reports to earn a Silver badge!</p> ";
    }else if(medal=="silver"){
        ms = "&nbsp;&nbsp;<b>Silver User</b><br><p style='font-size:80%'> Thank you for your worthy contribution! Keep sending or evaluating reports to earn a Gold badge!</p> ";
    }else{
        ms = "&nbsp;&nbsp;<b>Gold User</b><br><p style='font-size:80%'> Gongratulations! Your community is now a better place!</p> ";
    }
    
    
    text +="</table>";
    text +="<p style='font-size:80%'>*Includes all sent reports, accepted or not, by the traffic prediction algorithm.</p>";
    text +="<img src='img/"+medal+".png' width='60' height='83'>"+ms+"";
    
	return text;	

}


function reportNotification(obj){
    var id=obj["_id"]["$id"]; 
    var type=obj.type;
    var address=obj.address;
    var severity=obj.severity;
    var comments=obj.comments;
    var reporterId=obj.userId;
    var date = new Date(obj["time"]*1000);
    var userId=window.localStorage.getItem("email");

    if(reporterId !== userId){
        if(informedReports.indexOf(id)===-1 && reportHasBeenJudgedBefore(id)===false){
            var cm="";
            if(comments.length>2){
                cm="<br /> <b>Comments:</b> "+comments;
            }   
                                                        
            var reportText="<b>Type:</b> "+capitalizeFirstLetter(type)+"<br /><b>Severity:</b> "+capitalizeFirstLetter(severity)+"<br /><b>Location:</b> "+address+"<br />Time: "+date+cm;
            
            //var text="New report "+type+", severity:"+severity+", comments:"+comments+"\n at:"+address;
            
            
            //if(vibrationForIncomingReport==="true"){
            //    vibrateN();
            //}
            
            if(soundForIncomingReport==="true"){
                notifyN();
            }
            
            showAlertBootbox(reportText,"New report has been detected."); // Please evaluate if possible.
            
            informedReports.push(id);
        }
    }
}
  
function vibrateN(){
    navigator.notification.vibrate(1000);
}

function notifyN(){
    navigator.notification.beep(1);
}

function openManual(){
    var text=document.getElementById("userManual").innerHTML;
    if(!freeze){
        freeze=true;
        var b=document.getElementsByClassName("navbar-toggle");b[0].click();
        //hide the report button
        hideReportButton();
        bootbox.dialog({
            closeButton: false,
            className: modalClass,
            title: "<center><b>User Manual</b></center>",
            message: text,
            buttons: {
                success: {
                    label: "Ok",
                    className: "btn-success",
                    callback: function () {
                        bootbox.hideAll();
                        var b=document.getElementsByClassName("navbar-toggle");b[0].click();
                        freeze=false;
                        showReportButton();
                    }
                }
            }
        });
    }                    
}


function variableDefined(variable){
    if (typeof variable !== 'undefined') {
        return true;
    }else{
        return false;
    }
}


function validateEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}
    
    
function positionOnMap(){
    startIntervalMap();
    setMapView();
}


/*function checkSpeedAndMode(){    
    if(debug){
        console.log("check and spped function has been run");
    }
    
    if(mode=="drive" & speeds.length<4 & localStorage.length>3){
        showAlertBootbox("Do you really want to use drive mode? You can change the mode from the settings menu.");
    }
    if(mode=="walk" & speeds.length>4 & localStorage.length>3){
        showAlertBootbox("Do you really want to use walk mode? You can change the mode from the settings menu.");
    }
    speeds=[];
}*/




//===================================================================================
//--- Reference http://www.cs.uic.edu/~boxu/mp2p/p54-stenneth.pdf ---//

function checkSpeedAndMode(){    
    //if(mode=="drive" & (averageSpeed()<6 ||  

    if (averages.length != 0){
        // if average max speed <10 Or average speed <6 And average heading change rate >20%
        if((mode=="drive" || mode=="transportation") & ((averages[1] < 10) || ((averages[0] < 6) & (averages[2] > 20)))){
            showAlertBootbox("Do you really want to use "+ mode +" mode? You can change the mode from the settings menu.");
        }
        // if average max speed >10 Or average speed >6 And average heading change rate <20%
        if(mode=="walk" & ((averages[1] > 10) || ((averages[0] > 6)  & (averages[2] < 20)))){
            showAlertBootbox("Do you really want to use walk mode? You can change the mode from the settings menu.");
        }
        // if average max speed >10 Or average speed >6 And average heading change rate <20%
        if(mode=="cycling" & ((averages[1] < 7 || averages[1] > 30) || (averages[0] > 25 & averages[2] > 20) || (averages[0] < 6 & averages[2] < 10))){
            showAlertBootbox("Do you really want to use cycle mode? You can change the mode from the settings menu.");
        }
        
        averages = [];
    }
    speeds=[];
}



/**
 * This function returns the max and average speed from objects 
 * in locations array.
 *
 * @return array - An array who's first element is average and 
 *                 second is max speed
 */
function getSpeedVal(){
    var count1=0;
    var count2=0;
    var average=0;
    var max = 0;
    
    for (key in locations){
        var speed=parseInt(locations[key].speed);
        //console.log("speed"+speed);
        if(speed){
            if(speed>max){
                max = speed*3.6; // m/s to km/h
            }
            count1 = count1 + speed*3.6; // m/s to km/h
            count2++;
        }
    }
   
   if(count1!=0){
       average = count1/count2;
   }
   
   //console.log("Max speed: " + max.toFixed(2) + "km/h");
   //console.log("Average speed: " + average.toFixed(2) + "km/h");
   
   return [average,max];
}



/**
 * This function returns the max and average acceleration from objects 
 * in locations array.
 *
 * @return array - An array who's first element is average and 
 *                 second is max acceleration
 */
function getAccelerationVal(){
    
    var count1 = 0;
    var count2 = 0;
    var average = 0;
    var max = 0;
    
    if(locations.length>2){
        for (var i=0; i<locations.length; i++){
            var v1 = locations[i].speed;
            
            if(locations[i+1]){
                var v2 = locations[i+1].speed;
                
                if(mode=="drive"){
                    dt=3;
                }else if(mode=="transportation"){
                    dt=3;
                }else if(mode=="cycling"){
                    dt=6;
                }else{
                    dt=10;
                }
                    
                acc = (v2-v1)/dt;
                
                if(Math.abs(acc)>max){
                    max = acc; // m/s to km/h
                }
            
                //console.log(acc);
                count1 = count1 + Math.abs(acc);
                    
                count2++;
            }
        }
        //average = count1/count2;
    }
    
    if(count1!=0){
       average = count1/count2;
    }
    
    //console.log("Max acceleration: " + max.toFixed(2) + "m/s^2");
    //console.log("Average acceleration: " + average.toFixed(2) + "m/s^2");
    
    return [average,max];
}


/**
 * This function calculates the heading Change Rate percentage from objects 
 * in locations array.
 *
 * @return rate - the heading Change Rate percentage
 */
function headingChangeRate(){
    
    var count1 = 0;
    var count2 = 0;
    var rate = 0;

    if(locations.length>2){
        for (var i=0; i<locations.length; i++){
            var h1=locations[i].heading;
            
            if(locations[i+1]){
                var h2 = locations[i+1].heading;
                    
                dev = Math.abs(getDeviation(h1,h2));
                
                if(dev>40){ // if deviation greater than 40deg
                    //console.log(acc);
                    count1++;
                }
                count2++;
            }
        }
    }

    if(count1!=0){
       rate = (count1/count2)*100;
    }
 
    //console.log("Heading Change Rate: " + rate.toFixed(2) + "%");
    return rate;
}


/**
 * This function calculates the stops Rate percentage from objects 
 * in locations array.
 *
 * @return rate - the stops Rate percentage
 */
function stopRate(){
    
    var count1=0;
    var count2=0;
    var rate=0;
    
    for (key in locations){
        var speed=parseInt(locations[key].speed);
        
        if(speed){
            if(speed<2){ //If speed < 2
                count1++;
            }
            count2++;
        }
    }
   
   if(count1!=0){
       rate = (count1/count2)*100;
   }
   
   //console.log("Stop Rate: " + rate.toFixed(2) + "%");
   return rate;
}


/**
 * This function calculates the average of: average Speeds,
 * max Speeds and Heading Change Rates in locations array.
 *
 * @return averages - An array who's first element is average Speeds
 *                    second is average max Speeds and third is
 *                    average Heading Change Rates
 */
function averageMetrics(){
    var avSpeed = 0;
    var maxSpeed = 0;
    var avHeadingChange = 0;
    
    var count1=0;
    var count2=0;
    
    for (key in avSpeeds){
        if(avSpeeds[key]){
            count1=count1+avSpeeds[key];
            count2++;
        }
    }
    
    if(count1!=0){
       avSpeed = (count1/count2);
    }
    
    count1=0;
    count2=0;
    
    for (key in maxSpeeds){
        if(maxSpeeds[key]){
            count1=count1+maxSpeeds[key];
            count2++;
        }
    }
    
    if(count1!=0){
       maxSpeed = (count1/count2);
    }
    
    count1=0;
    count2=0;
    
    for (key in headingChanges){
        if(headingChanges[key]){
            count1=count1+headingChanges[key];
            count2++;
        }
    }
    
    if(count1!=0){
       avHeadingChange = (count1/count2);
    }
    
    /*console.log("-----------------------------------------");
    console.log("Average speed: " + avSpeed.toFixed(2) + "km/h");
    console.log("Average max speed: " + maxSpeed.toFixed(2) + "km/h");
    console.log("Average heading change rate: " + avHeadingChange.toFixed(2) + "%");
    console.log("-----------------------------------------");*/
    
    avSpeeds = [];
    maxSpeeds = [];
    headingChanges = [];
    
    averages = [avSpeed,maxSpeed,avHeadingChange];
    
    checkSpeedAndMode();
}

//===================================================================================

function sendPeriodicPositions(){
     
    var sp = getSpeedVal();
    var ac = getAccelerationVal();
    var h = headingChangeRate();
    var s = stopRate();
    
    avSpeeds.push(sp[0]);
    maxSpeeds.push(sp[1]);
    headingChanges.push(h);
    
    //alert("Average speed:"+sp[0].toFixed(2) + " Max speed:" + sp[1].toFixed(2) + " Average acc:"+ac[0].toFixed(2) + " Max acc:" + ac[1].toFixed(2) + " Headings:" +h + " Stops:" +s) ;
    
    //get The speeds to specific array
    var speed;
    for (key in locations){
        speed=locations[key].speed;
        if(speed){
            if(speed>3){
                speeds.push(speed);
            }
        }
   }
    
    if(locations.length){    
        var token=window.localStorage.getItem("token");
        var email=window.localStorage.getItem("email");
        var data=JSON.stringify(locations);
        //var data=CryptoJS.AES.encrypt(JSON.stringify(locations),email+"_iti", {format: CryptoJSAesJson}).toString();
        var url='http://'+server+'/sendPosition';
        var JSONdata='{"access_token":"'+token+'","userId":"'+email+'","locations":'+data+'}';
        var ajaxWorker_sendPosition=new Worker("js/ajax.js");
        ajaxWorker_sendPosition.postMessage([url,JSONdata]);
        
        ajaxWorker_sendPosition.onmessage= function(e){        
        	if(debug){
                console.log(e.data);
        	}
            if(e.data==0){
    		    //Network error
    	    }else{
    		    //success
    		}
            
            ajaxWorker_sendPosition.terminate();
        }
        locations=[];
    }
}



function changeMode(){        
    if(mode==="drive"){
        var mode1="checked='checked'";
        var mode2="";
        var mode3="";
        var mode4="";
    }else if (mode==="walk"){
        var mode2="checked='checked'";
        var mode1="";
        var mode3="";
        var mode4="";
    }else if (mode==="transportation"){
        var mode3="checked='checked'";
        var mode1="";
        var mode2="";
        var mode4="";
    }else if (mode==="cycling"){
        var mode4="checked='checked'";
        var mode1="";
        var mode2="";
        var mode3="";
    }
    
    if(!freeze){
        freeze=true; 
        bootbox.dialog({
            closeButton: false, 
            title: "<center><b>Change Mode</b></center>",
            message: '<div class="row"><div class="col-xs-12 ">'+
                //'Mode:'+
                //==========================================================================================================================
                /*'<div class="navigation-bar">'+
                  '<div class="navigation-bar__center">'+
                    '<div class="button-bar" style="width:200px">'+
                      '<div class="button-bar__item">'+
                        '<input type="radio" name="severity" id="mode1" '+mode1+' value="drive">'+
                        '<div class="button-bar__button">Drive</div>'+
                      '</div>'+
                
                      '<div class="button-bar__item">'+
                        '<input type="radio" name="severity" id="mode2" '+mode2+'  value="walk">'+
                        '<div class="button-bar__button">Walk</div>'+
                      '</div>'+
                    '</div>'+
                  '</div>'+
                '</div>'+*/
                
                
                //'<ul class="list">'+
                //  '<li class="list__item list__item--tappable">'+
                    '<label class="radio-button radio-button--list-item">'+
                      '<input type="radio" name="severity" id="mode1" '+mode1+' value="drive">'+
                      '<div class="radio-button__checkmark radio-button--list-item__checkmark"></div>'+
                      '&nbsp;<i class="fa fa-car"></i>&nbsp;Drive'+
                    '</label>'+
                //  '</li>'+
                //  '<li class="list__item list__item--tappable">'+
                    '<label class="radio-button radio-button--list-item">'+
                      '<input type="radio" name="severity" id="mode2" '+mode2+'  value="walk">'+
                      '<div class="radio-button__checkmark radio-button--list-item__checkmark"></div>'+
                      '&nbsp;&nbsp;<i class="fa fa-user"></i>&nbsp;Walk'+
                    '</label>'+
                //  '</li>'+
                //  '<li class="list__item list__item--tappable">'+
                    '<label class="radio-button radio-button--list-item">'+
                      '<input type="radio" name="severity" id="mode3" '+mode3+'  value="transportation">'+
                      '<div class="radio-button__checkmark radio-button--list-item__checkmark"></div>'+
                      '&nbsp;&nbsp;<i class="fa fa-bus"></i>&nbsp;Transportation'+
                    '</label>'+
                //  '</li>'+
                //  '<li class="list__item list__item--tappable">'+
                    '<label class="radio-button radio-button--list-item">'+
                      '<input type="radio" name="severity" id="mode4" '+mode4+'  value="cycling">'+
                      '<div class="radio-button__checkmark radio-button--list-item__checkmark"></div>'+
                      '&nbsp;<i class="fa fa-bicycle"></i>&nbsp;Cycle'+
                    '</label>'+
                //  '</li>'+
                //'</ul>'+
                
                //==========================================================================================================================
                
                //'<div class="radio-inline">'+
                //'<input type="radio" name="severity" id="mode1" '+mode1+' value="drive">Drive'+
                //'</div>'+
                //'<div class="radio-inline">'+
                //'<input type="radio" name="severity" id="mode2" '+mode2+'  value="walk">Walk'+
                //'</div>'+
                '</div>'+
                '</div>',
                
            className: modalClass,
            buttons: {
                success: {
                    label: "<i class='fa fa-save'></i> Save",
                    className: "btn-success",
                    callback: function () {
                                                
                        if (document.getElementById('mode1').checked) {
                            var modeF="drive";         
                        }
                        if (document.getElementById('mode2').checked) {
                            var modeF="walk";        
                        }
                        if (document.getElementById('mode3').checked) {
                            var modeF="transportation";        
                        }
                        if (document.getElementById('mode4').checked) {
                            var modeF="cycling";        
                        }
                                                                                    
                        window.localStorage.setItem("mode", modeF);
                        mode=modeF;
                        
                        changeLayer(mode);
                           
                        //Smooth transaction between two stages
                        if(mode==="drive"){         
                           icon="car";
                           refreshMap=carRefreshMap;
                        }else if (mode==="transportation"){         
                           icon="bus";
                           refreshMap=transRefreshMap;
                        }else if (mode==="cycling"){         
                           icon="bicycle";
                           refreshMap=cycleRefreshMap;
                        }else{
                           refreshMap=walkRefreshMap;        
                           icon="user";
                        }
                           
                        stopIntervalMap();
                        startIntervalMap();
                           
                        document.getElementById('userMode').innerHTML="<a class='navbar-brand' onclick='changeMode()'><i class='fa fa-"+icon+"'></i></a>";    
                            
                        var b=document.getElementsByClassName("navbar-toggle");
                            b[0].click();
                            freeze=false;
                        }
                    },cancel:{
                        label: "Cancel",
                        className: "btn-default",
                        callback: function () {
                            bootbox.hideAll();
                            freeze=false;
                        }
                    }
                }
            }
        );
    }    
}


//Image cache
function startCache() {
    // see console output for debug info
    ImgCache.options.debug = debug;
    ImgCache.options.usePersistentCache = true;
    ImgCache.options.cacheClearSize=10; //in MB
    ImgCache.init();
}

function openIptil() {
    window.open("http://www.iti.gr/iti/index.html", '_system');
}

function openLicence() {
    window.open("https://www.gnu.org/copyleft/lesser.html", '_system');
}

function openSite() {
    window.open("", '_system');
}

function openGooglePlay() {
    window.open("", '_system');
}

function openItunes() {
    window.open(encodeURI(''), '_blank', 'location=yes,enableViewPortScale=yes');
}

function showAbout(){
    var text='Device Model: '    + device.model    + '<br/>' +               
              'Device Platform: ' + device.platform +' '+ device.version+ '<br/>' +
              "<p>Developer: <a href='javascript:openIptil();'>CERTH-ITI</a><br />Version: "+version+"</p>"+
              "<p>This programm is distributed under the GNU Lesser General Public License 3.0: <a href='javascript:openLicence();'>https://www.gnu.org</a></p>";
              
              
              //"<p>-Visit our webpage: <a href='javascript:openSite();'></a></p>";
              
              
              
    //if(device.platform == "Android"){
    //    text = text + '-Rate us or send us feedback on <br><button type="button" class="btn btn-danger" onCLick="openGooglePlay()">Google Play</button>';         
    //}else{
    //    text = text + '-Rate us or send us feedback on <br><button type="button" class="btn btn-danger" onCLick="openItunes()">iTunes</button>';
    //}              
    
    //'Rate us on <a href="">Google Play</a>';   
    
    if(!freeze){
        freeze=true;
        var b=document.getElementsByClassName("navbar-toggle");b[0].click();
        bootbox.dialog({
            closeButton: false,
            className: modalClass,
            title: "<center><b>About</b></center>",
            message: text,
            buttons: {
                success: {
                    label: "Ok",
                    className: "btn-success",
                    callback: function () {
                        bootbox.hideAll();
                        freeze=false;                                                            
                    }
                }
            }
        });   
    }                    
}


function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}


function getReportStatus(ids){
    var token=window.localStorage.getItem("token");    
    var url= 'http://'+server+'/getReportStatus';
    var  JSONdata='{"access_token":"'+token+'","ids":'+ids+'}';
    var ajaxWorker_getReportStatus=new Worker("js/ajax.js");
    ajaxWorker_getReportStatus.postMessage([url,JSONdata]);
    
    ajaxWorker_getReportStatus.onmessage= function(e){        
        obj=JSON.parse(e.data);          
        showAlertBootbox(obj.text,"Report Evaluation Results","Ok",9000);
        
        ajaxWorker_getReportStatus.terminate();
    }
}


function getSingleReportStatus(oid){
    var token=window.localStorage.getItem("token");    
    var url= 'http://'+server+'/getSingleReportStatus';
    var ajaxWorker_getSingleReportStatus=new Worker("js/ajax.js");
    var  JSONdata='{"access_token":"'+token+'","oid":"'+oid+'"}';
    ajaxWorker_getSingleReportStatus.postMessage([url,JSONdata]);
    
    ajaxWorker_getSingleReportStatus.onmessage= function(e){        
        obj=JSON.parse(e.data);
        alertify.log("The report you have sent has been evaluated as: "+obj.TF,5000);
        
        ajaxWorker_getSingleReportStatus.terminate();
    }
}


function loginFB() {
    openFB.init({appId: '1554547501535737'});
    openFB.login(
        function(response) {
            console.log(response);
            if(response.status === 'connected') {
                alert('Facebook login succeeded, got access token: ' + response.authResponse.token);
            } else {
                alert('Facebook login failed: ' + response.error);
            }
        }, {scope: 'email'}
    );
}
    

function hideReportButton(){
    var d = document.getElementById("buttons");
    d.className = d.className + " hide";
    
    // var e = document.getElementById("newPoiButton");
    // e.className = e.className + " hide";
    // 
    // var f = document.getElementById("planButton");
    // f.className = f.className + " hide";
}
 

function showReportButton(){
    var d = document.getElementById("buttons");
    setTimeout(function(){d.className = "";},1000);
    
    // var e = document.getElementById("newPoiButton");
    // setTimeout(function(){e.className = "col-xs-4";},1000);
    // 
    // var f = document.getElementById("planButton");
    // setTimeout(function(){f.className = "col-xs-4";},1000);
}


/**
 * Calculate the bearing between two positions as a value from 0-360
 *
 * @param lat1 - The latitude of the first position
 * @param lng1 - The longitude of the first position
 * @param lat2 - The latitude of the second position
 * @param lng2 - The longitude of the second position
 *
 * @return int - The bearing between 0 and 360
 */
function getBearing(lat1,lng1,lat2,lng2) {
    var dLon = (lng2-lng1);
    var y = Math.sin(dLon) * Math.cos(lat2);
    var x = Math.cos(lat1)*Math.sin(lat2) - Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLon);
    var brng = this.toDeg(Math.atan2(y, x));
    return (360 - ((brng + 360) % 360)).toFixed(4);
}


/**
 * Since not all browsers implement this we have our own utility that will
 * convert from degrees into radians
 *
 * @param deg - The degrees to be converted into radians
 * @return radians
 */
function toRad(deg) {
    return deg * Math.PI / 180;
}


/**
 * Since not all browsers implement this we have our own utility that will
 * convert from radians into degrees
 *
 * @param rad - The radians to be converted into degrees
 * @return degrees
 */
function toDeg(rad) {
    return rad * 180 / Math.PI;
}


/**
 * Returns a signed angle for any given angles
 *
 * @param source - The source angle
 * @param target - The target angle
 * @return degrees - a signed angle in degrees
 */
function getDeviation(source, target) {
    var a = target - source;
    return Math.abs(((a + 180) % 360 - 180).toFixed(4));
}


/**
 * Checks if the user is heading towards a given position in a field of 70 degrees
 *
 * @param source - The source coordinates
 * @param target - The target coordinates
 * @return boolean
 */
function isHeadingTowards(lat1,lng1,lat2,lng2,heading){
    var bearing = getBearing(lat1,lng1,lat2,lng2);
    if(heading){
        if (getDeviation(bearing, heading) <= angleThreshold){
            return true;
        } else {
            return false;
        }
    }else{
        return true;
    }
}


/******************* Dim Tsouk Add ***********************************************/   
/**
 * Returns the weighted average angle given an array of angles as an input
 *
 * @param angles - The array of the angles
 * @return angle - The weighted average angle of the angles
 */
function averageAngle2(angles){
    var sinTotals = 0;
    var cosTotals = 0;
    var weights = [];   //array with heading weights

    for (var i = angles.length; i > 0; i--){  //calculate weights i.e. w10=10, w9=9,...,w1=1
        weights[i-1]=i;
    }
    
    for (angle in angles){
        sinTotals = sinTotals + Math.sin(toRad(angles[angle]))*weights[angle];
        cosTotals = cosTotals + Math.cos(toRad(angles[angle]))*weights[angle];
    }

    var angle = (toDeg(Math.atan2(sinTotals, cosTotals)) + 360) % 360;
    
    return angle;
}    


/**
 * Resets the inputServer box to the default_server value set at config.js
 */
//function resetServer(){
//    document.getElementById("inputServer").value = default_server;
//}


/**
 * Retrieves the bounding box coordinates (topLeft,topRight,bottomRight,bottomLeft),
 * sends them to getTraffic API which returns a geoJson Object and then calls
 * drawTraffic()
 *
 * @param -
 * @return -
 */
function getBoundingBoxCoords(){
    var bounds = map.getBounds();
    var topLeft = bounds.getNorthWest().wrap();
    var topRight = bounds.getNorthEast().wrap();
    var bottomRight = bounds.getSouthEast().wrap();
    var bottomLeft = bounds.getSouthWest().wrap();

    //=============================geoJsonParser============================/
    /*var geojsonLines = [{
        "type": "LineString",
        "coordinates": [[40.639345, 22.943879],[40.636968, 22.941964]],
        "color": "red"
    }, {
        "type": "LineString",
        "coordinates": [[-105, 40], [-110, 45], [-115, 55]],
        "color": "green"
    }];
    
    geojsonString = '{"geojsonLines":[{"type": "LineString", "coordinates": [[40.639345, 22.943879],[40.636968, 22.941964]], "color": "red"}, {"type": "LineString", "coordinates": [[-105, 40], [-110, 45], [-115, 55]], "color": "green"}]}';
    
    var json = JSON.parse(geojsonString);
    
    /*for(i=0;i<(json.geojsonLines).length;i++){
        console.log(json.geojsonLines[i].type);
        
        for(j=0;j<(json.geojsonLines[i].coordinates).length;j++){
            console.log(json.geojsonLines[i].coordinates[j]); 
        }
 
        console.log(json.geojsonLines[i].color);
    }*/
    //====================================================================/
    
        
    var array = [topLeft,topRight,bottomRight,bottomLeft];
    var coords = JSON.stringify(array);
    //coords = JSON.stringify(inboxMessageId);
    
    var token=window.localStorage.getItem("token");
    var url= 'http://'+server+'/getTraffic';
    var JSONdata='{"access_token":"'+token+'","coords":'+coords+'}';
    var ajaxWorker_getTraffic=new Worker("js/ajax.js");
    ajaxWorker_getTraffic.postMessage([url,JSONdata]);
    
    ajaxWorker_getTraffic.onmessage= function(e){     
        if(e.data==0){
		    //Network error
	    }else{
            t=JSON.parse(e.data);          
            
            var result=t["result"];
            var text=t["text"];
            var geojsonLines=t["data"];  
            
            //alert("Result: "+text);
            
            drawTraffic(geojsonLines);

	    }
        
        ajaxWorker_getTraffic.terminate();
    }
}


/**
 * Creates a new Layer with a group of polylines and adds it on the map 
 *
 * @param geojsonLines - An array with traffic objects
 */
function drawTraffic(geojsonLines) {

    /*var geojsonLines = [{
        "type": "Feature",
        "properties": {"color": "red"},
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [22.930635, 40.642776],
                [22.942158, 40.636881],
                [22.952157, 40.631670],
                [22.956341, 40.629537],
                [22.960826, 40.625173]
            ]
        }
    }, { 
        "type": "Feature",
        "properties": {"color": "yellow"},
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [22.937284, 40.633769],
                [22.942992, 40.639810]
            ]
        }
    }, {
        "type": "Feature",
        "properties": {"color": "green"},
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [22.935524, 40.644483],
                [22.956295, 40.634356]
            ]
        }
    }, {
        "type": "Feature",
        "properties": {"color": "red"},
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [22.935055, 40.635294],
                [22.949046, 40.626292]
            ]
        }
    }];*/

    if (trafficLayer){
        map.removeLayer(trafficLayer);
    }
    
    trafficLayer = L.geoJson().addTo(map);

    L.geoJson(geojsonLines, {
        style: function(feature) {
            switch (feature.properties.color) {
                case 'red': return {color: 'black', opacity: 0.15, weight: 14};
                case 'yellow': return {color: 'black', opacity: 0.15, weight: 14};
                case 'green': return {color: 'black', opacity: 0.15, weight: 14};
            }
        }
    }).addTo(trafficLayer);
    
    L.geoJson(geojsonLines, {
        style: function(feature) {
            switch (feature.properties.color) {
                case 'red': return {color: 'white', opacity: 0.8, weight: 11};
                case 'yellow': return {color: 'white', opacity: 0.8, weight: 11};
                case 'green': return {color: 'white', opacity: 0.8, weight: 11};
            }
        }
    }).addTo(trafficLayer);
    
    L.geoJson(geojsonLines, {
        style: function(feature) {
            switch (feature.properties.color) {
                case 'red': return {color: 'red', opacity: 1, weight: 7};
                case 'yellow': return {color: 'yellow', opacity: 1, weight: 7};
                case 'green': return {color: 'green', opacity: 1, weight: 7};
            }
        }
    }).addTo(trafficLayer);
    
}


/**
 * Changes tha Map Layer depending on user mode (drive,walk,transportation,cycle) 
 *
 * @param mode - A string containing the user mode
 */
function changeLayer(mode) {
    if(mode=="drive"){
        tile = driveTile;
    }else if(mode=="transportation"){
        tile = transportTile;
    }else if(mode=="cycling"){
        tile = cycleTile;
    }else{
        tile = driveTile;
    }
    
    map.removeLayer(currTileLayer);
    currTileLayer = new L.TileLayer(tile, { attribution: osmAttrib,attributionControl: false });
    var osmAttrib = '';
    map.addLayer(currTileLayer);
    map.attributionControl.setPrefix("");
}


/**
 * Evaluates the user based on user credits and assignes a badge
 *
 * @param stats - The reports evaluated as false
 * @param sentReport - number of reports sent by the user
 * @param sentFeedback - number of report evaluations sent by the user
 * 
 * @return - string containing the badge type (gold,silver,bronze)
 */
function evaluateCredits(stats,sentReport,sentFeedback) {
    var repSent=0;
    var feedbackSent=0;
    var score=0;
    
    for (key in sentReport){
        if(!sentReport[key]){
            sentReport[key]=0;
        }
        if(!sentFeedback[key]){
            sentFeedback[key]=0;
        }
            
        repSent = repSent + parseInt(sentReport[key]);
        feedbackSent = feedbackSent + parseInt(sentFeedback[key]);
        	
	}
    
    score = (repSent+feedbackSent-stats)/2;
    // console.log("Reports:" + repSent);
    // console.log("Feedback:" + feedbackSent);
    // console.log(stats);
        
    if(score<50){
        return "bronze"
    }else if(score<100){
        return "silver"
    }else{
        return "gold";
    }

}

//=====================================================================================//

function ratingActions(oid) {
    var text = '<div><p class="ratings">'+ 
                '<span><input type="radio" name="rating" id="str5" value="5"><label for="str5"><i class="fa fa-star fa-fw fa-2x"></i></label></span>'+
                '<span><input type="radio" name="rating" id="str4" value="4"><label for="str4"><i class="fa fa-star fa-fw fa-2x"></i></label></span>'+
                '<span><input type="radio" name="rating" id="str3" value="3"><label for="str3"><i class="fa fa-star fa-fw fa-2x"></i></label></span>'+
                '<span><input type="radio" name="rating" id="str2" value="2"><label for="str2"><i class="fa fa-star fa-fw fa-2x"></i></label></span>'+
                '<span><input type="radio" name="rating" id="str1" value="1"><label for="str1"><i class="fa fa-star fa-fw fa-2x"></i></label></span>'+
                '</p>&nbsp;</div>';
                
    bootbox.dialog({
        closeButton: false, 
        title: "<center><b>Rating</b></center>",
        message: "Please select your rate:<br>" + text,
        className: modalClass,
        buttons: {
            success: {
                label: "<i class='fa fa-star'></i> Submit Rate",
                className: "btn-success",
                callback: function () {
                    
                    if(document.getElementById("str5").checked == true) {
                        setRating(5);
                    }
                    
                    if(document.getElementById("str4").checked == true) {
                        setRating(4);
                    }
                    
                    if(document.getElementById("str3").checked == true) {
                        setRating(3);
                    }
                    
                    if(document.getElementById("str2").checked == true) {
                        setRating(2);
                    }
                    
                    if(document.getElementById("str1").checked == true) {
                        setRating(1);
                    }
                    
                    submitRating(oid);
                    freeze=false;                                        
                }
            },cancel: {
                label: "Cancel",
                className: "btn-default",
                callback: function () {
                    bootbox.hideAll();
                    freeze=false;
                }
            }
        }            
    });

}

function setRating(r) {
    rating = r;
}

function getRating(k) {
    
    if(pois[k].ratings) {
        var counter = 0;
        
        if(pois[k].ratings.length > 0){
            for (var key in pois[k].ratings) {
                counter = counter + pois[k].ratings[key].rating;
            }
        
            return [counter/pois[k].ratings.length,pois[k].ratings.length]; // [total rating, number of rates]
        }else{
            return null;
        }
    }else{
        return null;
    }

}

function submitRating(oid) {
    var alreadyRated = false;
    
    selectedPoi = oid;
    userName = window.localStorage.getItem("userName");
    
    uploadRatingToDb(userName,rating);
    
    /*for (var key in pois[oid].ratings){
        if(pois[oid].ratings[key].name == userName){
            alreadyRated = true;
            
            pois[oid].ratings[key].rating = rating;
            
            showAlertBootbox("Your previous rating has changed!","Success");
            
            drawPois();
        }
    }
    
    if(!alreadyRated){
        pois[oid].ratings.push({"name":userName,"rating":rating});
        
        showAlertBootbox("Rate Submited!","Success");
        
        drawPois();
    }*/
}

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
        }
    return s4() + s4() +  s4() + s4() + s4() +  s4()  ;
}

function createPois() {
    
    var oid = guid();
    var userId = "tsoukj";
    var latitude = "40.626452";
    var longitude = "22.948426";
    //var name = "Λευκός Πύργος";
    var name = "White Tower";
    var tags = ["Museum","Landmark","Monument"];
    var url = "https://en.wikipedia.org/wiki/White_Tower_of_Thessaloniki";
    var ratings = [{"name":"tsoukj","rating":3},{"name":"mike","rating":5}];
    
    var new_poi = new poi(oid,userId,latitude,longitude,name,url,tags,ratings);
    pois[oid]=new_poi;
    
    var oid = guid();
    var userId = "tsoukj";
    var latitude = "40.626275";
    var longitude = "22.954619";
    //var name = "Πύργος ΟΤΕ";
    var name = "OTE Tower";
    var url = "https://en.wikipedia.org/wiki/OTE_Tower";
    var tags = ["Landmark"];
    var ratings = [{"name":"tsoukj","rating":4}];
    
    var new_poi = new poi(oid,userId,latitude,longitude,name,url,tags,ratings);
    pois[oid]=new_poi;
     
    var oid = guid();
    var userId = "tsoukj";
    var latitude = "40.629956";
    var longitude = "22.949827";
    //var name = "Παλάτι του Γαλέριου";
    var name = "Palace of Galerius";
    var url = "https://el.wikipedia.org/wiki/%CE%91%CE%BD%CE%AC%CE%BA%CF%84%CE%BF%CF%81%CE%B1_%CF%84%CE%BF%CF%85_%CE%93%CE%B1%CE%BB%CE%AD%CF%81%CE%B9%CE%BF%CF%85";
    var tags = ["Landmark","Monument"];
    var ratings = [{"name":"tsoukj","rating":4}];
    
    var new_poi = new poi(oid,userId,latitude,longitude,name,url,tags,ratings);
    pois[oid]=new_poi;
    
    var oid = guid();
    var userId = "tsoukj";
    var latitude = "40.632241";
    var longitude = "22.951743";
    //var name = "Αψίδα του Γαλερίου";
    var name = "Arch of Galerius";
    var url = "https://en.wikipedia.org/wiki/Arch_of_Galerius_and_Rotunda";
    var tags = ["Landmark","Monument"];
    var ratings = [{"name":"tsoukj","rating":5}];
    
    var new_poi = new poi(oid,userId,latitude,longitude,name,url,tags,ratings);
    pois[oid]=new_poi;
    
    var oid = guid();
    var userId = "tsoukj";
    var latitude = "40.633232";
    var longitude = "22.952729";
    //var name = "Ροτόντα";
    var name = "Rotunda";
    var url = "https://en.wikipedia.org/wiki/Arch_of_Galerius_and_Rotunda";
    var tags = ["Religious Site","Landmark","Monument"];
    var ratings = [{"name":"tsoukj","rating":3}];
    
    var new_poi = new poi(oid,userId,latitude,longitude,name,url,tags,ratings);
    pois[oid]=new_poi;
    
    var oid = guid();
    var userId = "tsoukj";
    var latitude = "40.635638";
    var longitude = "22.954134";
    //var name = "Μουσείο Ατατούρκ Θεσσαλονίκης";
    var name = "Atatürk Museum";
    var url = "https://en.wikipedia.org/wiki/Atat%C3%BCrk_Museum_(Thessaloniki)";
    var tags = ["Museum","Landmark","Monument"];
    var ratings = [{"name":"tsoukj","rating":3}];
    
    var new_poi = new poi(oid,userId,latitude,longitude,name,url,tags,ratings);
    pois[oid]=new_poi;
    
    var oid = guid();
    var userId = "tsoukj";
    var latitude = "40.632823";
    var longitude = "22.946890";
    //var name = "Iερός Ναός Αγίας Σοφίας";
    var name = "Hagia Sophia";
    var url = "https://en.wikipedia.org/wiki/Hagia_Sophia,_Thessaloniki";
    var tags = ["Religious Site","Landmark","Monument"];
    var ratings = [{"name":"tsoukj","rating":4}];
    
    var new_poi = new poi(oid,userId,latitude,longitude,name,url,tags,ratings);
    pois[oid]=new_poi;
    
    var oid = guid();
    var userId = "tsoukj";
    var latitude = "40.632335";
    var longitude = "22.940796";
    //var name = "Πλατεία Αριστοτέλους";
    var name = "Aristotelous Square";
    var url = "https://en.wikipedia.org/wiki/Aristotelous_Square";
    var tags = ["Landmark"];
    var ratings = [{"name":"tsoukj","rating":5}];
    
    var new_poi = new poi(oid,userId,latitude,longitude,name,url,tags,ratings);
    pois[oid]=new_poi;
    
    var oid = guid();
    var userId = "tsoukj";
    var latitude = "40.635734";
    var longitude = "22.945210";
    //var name = "Μπέη Χαμαμ";
    var name = "Bey Hamam";
    var url = "https://en.wikipedia.org/wiki/Bey_Hamam";
    var tags = ["Landmark","Monument"];
    var ratings = [{"name":"tsoukj","rating":3}];
    
    var new_poi = new poi(oid,userId,latitude,longitude,name,url,tags,ratings);
    pois[oid]=new_poi;
    
    var oid = guid();
    var userId = "tsoukj";
    var latitude = "40.637638";
    var longitude = "22.944795";
    //var name = "Αρχαία Ρωμαική Αγορά";
    var name = "Ancient Roman Agora";
    var url = "https://en.wikipedia.org/wiki/Agora";
    var tags = ["Landmark","Monument","Museum"];
    var ratings = [{"name":"tsoukj","rating":4}];
    
    var new_poi = new poi(oid,userId,latitude,longitude,name,url,tags,ratings);
    pois[oid]=new_poi;
    
    var oid = guid();
    var userId = "tsoukj";
    var latitude = "40.638803";
    var longitude = "22.947753";
    //var name = "Ιερός Ναός Αγίου Δημητρίου";
    var name = "Hagios Demetrios";
    var url = "https://en.wikipedia.org/wiki/Hagios_Demetrios";
    var tags = ["Religious Site","Landmark","Monument"];
    var ratings = [{"name":"tsoukj","rating":5}];
    
    var new_poi = new poi(oid,userId,latitude,longitude,name,url,tags,ratings);
    pois[oid]=new_poi;
    
    var oid = guid();
    var userId = "tsoukj";
    var latitude = "40.623919";
    var longitude = "22.955017";
    //var name = "Μουσείο Βυζαντινού Πολιτισμού";
    var name = "Museum of Byzantine Culture";
    var url = "https://en.wikipedia.org/wiki/Museum_of_Byzantine_Culture";
    var tags = ["Museum"];
    var ratings = [{"name":"tsoukj","rating":4}];
    
    var new_poi = new poi(oid,userId,latitude,longitude,name,url,tags,ratings);
    pois[oid]=new_poi;
    
    var oid = guid();
    var userId = "tsoukj";
    var latitude = "40.644079";
    var longitude = "22.961883";
    //var name = "Επταπύργιο";
    var name = "Heptapyrgion";
    var url = "https://en.wikipedia.org/wiki/Heptapyrgion_(Thessaloniki)";
    var tags = ["Landmark","Monument"];
    var ratings = [{"name":"tsoukj","rating":5}];
    
    var new_poi = new poi(oid,userId,latitude,longitude,name,url,tags,ratings);
    pois[oid]=new_poi;
    
    var oid = guid();
    var userId = "tsoukj";
    var latitude = "40.658047";
    var longitude = "22.931542";
    //var name = "Κρατικό Μουσείο Σύγχρονης Τέχνης";
    var name = "State Museum of Contemporary Art";
    var url = "https://en.wikipedia.org/wiki/State_Museum_of_Contemporary_Art";
    var tags = ["Museum"];
    var ratings = [{"name":"tsoukj","rating":5}];
    
    var new_poi = new poi(oid,userId,latitude,longitude,name,url,tags,ratings);
    pois[oid]=new_poi;
    
    var oid = guid();
    var userId = "tsoukj";
    var latitude = "40.641796";
    var longitude = "22.954503";
    //var name = "Μονή Βλατάδων";
    var name = "Vlatades Monastery";
    var url = "https://en.wikipedia.org/wiki/Vlatades_Monastery";
    var tags = ["Religious Site","Monument"];
    var ratings = [{"name":"tsoukj","rating":5}];
    
    var new_poi = new poi(oid,userId,latitude,longitude,name,url,tags,ratings);
    pois[oid]=new_poi;
    
    var oid = guid();
    var userId = "tsoukj";
    var latitude = "40.641778";
    var longitude = "22.952353";
    //var name = "Ναός Οσίου Δαβίδ";
    var name = "Church of Hosios David";
    var url = "https://en.wikipedia.org/wiki/Church_of_Hosios_David";
    var tags = ["Religious Site"];
    var ratings = [{"name":"tsoukj","rating":4}];
    
    var new_poi = new poi(oid,userId,latitude,longitude,name,url,tags,ratings);
    pois[oid]=new_poi;
    
    var oid = guid();
    var userId = "tsoukj";
    var latitude = "40.637690";
    var longitude = "22.956168";
    //var name = "Ναός Αγίου Νικολάου του Ορφανού";
    var name = "Church of Saint Nicholas Orphanos";
    var url = "https://en.wikipedia.org/wiki/Church_of_Saint_Nicholas_Orphanos";
    var tags = ["Religious Site"];
    var ratings = [{"name":"tsoukj","rating":4}];
    
    var new_poi = new poi(oid,userId,latitude,longitude,name,url,tags,ratings);
    pois[oid]=new_poi;
    
    var oid = guid();
    var userId = "tsoukj";
    var latitude = "40.643166";
    var longitude = "22.944281";
    //var name = "Ναός Αγίας Αικατερίνης";
    var name = "Church of Saint Catherine";
    var url = "https://en.wikipedia.org/wiki/Church_of_Saint_Catherine,_Thessaloniki";
    var tags = ["Religious Site"];
    var ratings = [{"name":"tsoukj","rating":4}];
    
    var new_poi = new poi(oid,userId,latitude,longitude,name,url,tags,ratings);
    pois[oid]=new_poi;
    
    var oid = guid();
    var userId = "tsoukj";
    var latitude = "40.639170";
    var longitude = "22.949650";
    //var name = "Τζαμί Αλατζά Ιμαρέτ";
    var name = "Alaca Imaret Mosque";
    var url = "https://en.wikipedia.org/wiki/Alaca_Imaret_Mosque";
    var tags = ["Landmark","Monument"];
    var ratings = [{"name":"tsoukj","rating":4}];
    
    var new_poi = new poi(oid,userId,latitude,longitude,name,url,tags,ratings);
    pois[oid]=new_poi;
    
    var oid = guid();
    var userId = "tsoukj";
    var latitude = "40.636793";
    var longitude = "22.943656";
    //var name = "Ιερός Ναός Παναγίας των Χαλκέων";
    var name = "Church of Panagia Chalkeon";
    var url = "https://en.wikipedia.org/wiki/Church_of_Panagia_Chalkeon";
    var tags = ["Religious Site","Landmark","Monument"];
    var ratings = [{"name":"tsoukj","rating":4}];
    
    var new_poi = new poi(oid,userId,latitude,longitude,name,url,tags,ratings);
    pois[oid]=new_poi;
    
    var oid = guid();
    var userId = "tsoukj";
    var latitude = "40.636600";
    var longitude = "22.941178";
    //var name = "Μπεζεστένι (Σκεπαστή Αγορά)";
    var name = "Bedesten of Thessaloniki";
    var url = "https://en.wikipedia.org/wiki/Bedesten";
    var tags = ["Landmark"];
    var ratings = [{"name":"tsoukj","rating":3}];
    
    var new_poi = new poi(oid,userId,latitude,longitude,name,url,tags,ratings);
    pois[oid]=new_poi;
    
    var oid = guid();
    var userId = "tsoukj";
    var latitude = "40.634980";
    var longitude = "22.936437";
    //var name = "Λαδάδικα";
    var name = "Ladadika";
    var url = "https://en.wikipedia.org/wiki/Ladadika";
    var tags = ["Landmark"];
    var ratings = [{"name":"tsoukj","rating":5}];
    
    var new_poi = new poi(oid,userId,latitude,longitude,name,url,tags,ratings);
    pois[oid]=new_poi;
    
    var oid = guid();
    var userId = "tsoukj";
    var latitude = "40.632290";
    var longitude = "22.941236";
    //var name = "Άγαλμα του Αριστοτέλη";
    var name = "Statue of Aristotle";
    var url = "https://en.wikipedia.org/wiki/Aristotle";
    var tags = ["Landmark","Monument"];
    var ratings = [{"name":"tsoukj","rating":4}];
    
    var new_poi = new poi(oid,userId,latitude,longitude,name,url,tags,ratings);
    pois[oid]=new_poi;
    
    var oid = guid();
    var userId = "tsoukj";
    var latitude = "40.634966";
    var longitude = "22.947929";
    //var name = "Ιερός Ναός Παναγία Aχειροποίητος";
    var name = "Church of the Acheiropoietos";
    var url = "https://en.wikipedia.org/wiki/Church_of_the_Acheiropoietos";
    var tags = ["Religious Site","Landmark","Monument"];
    var ratings = [{"name":"tsoukj","rating":4}];
    
    var new_poi = new poi(oid,userId,latitude,longitude,name,url,tags,ratings);
    pois[oid]=new_poi;
    
    var oid = guid();
    var userId = "tsoukj";
    var latitude = "40.635050";
    var longitude = "22.937702";
    //var name = "Μουσείο Αρχαίων, Βυζαντινών και Μεταβυζαντινών Μουσικών Οργάνων";
    var name = "Museum of Ancient Greek, Byzantine and Post-Byzantine Instruments";
    var url = "https://en.wikipedia.org/wiki/Museum_of_Ancient_Greek,_Byzantine_and_Post-Byzantine_Instruments";
    var tags = ["Museum"];
    var ratings = [{"name":"tsoukj","rating":5}];
    
    var new_poi = new poi(oid,userId,latitude,longitude,name,url,tags,ratings);
    pois[oid]=new_poi;
    
    var oid = guid();
    var userId = "tsoukj";
    var latitude = "40.635128";
    var longitude = "22.939543";
    //var name = "Εβραϊκό Μουσείο Θεσσαλονίκης";
    var name = "Jewish Museum of Thessaloniki";
    var url = "https://en.wikipedia.org/wiki/Jewish_Museum_of_Thessaloniki";
    var tags = ["Museum"];
    var ratings = [{"name":"tsoukj","rating":4}];
    
    var new_poi = new poi(oid,userId,latitude,longitude,name,url,tags,ratings);
    pois[oid]=new_poi;
    
    var oid = guid();
    var userId = "tsoukj";
    var latitude = "40.632833";
    var longitude = "22.935490";
    //var name = "Μουσείο Φωτογραφίας Θεσσαλονίκης";
    var name = "Museum of Photography, Thessaloniki";
    var url = "https://en.wikipedia.org/wiki/Museum_of_Photography,_Thessaloniki";
    var tags = ["Museum"];
    var ratings = [{"name":"tsoukj","rating":5}];
    
    var new_poi = new poi(oid,userId,latitude,longitude,name,url,tags,ratings);
    pois[oid]=new_poi;
    
    var oid = guid();
    var userId = "tsoukj";
    var latitude = "40.630842";
    var longitude = "22.943431";
    //var name = "Μουσείο Μακεδονικού Αγώνα";
    var name = "Museum for the Macedonian Struggle";
    var url = "https://en.wikipedia.org/wiki/Museum_for_the_Macedonian_Struggle_(Thessaloniki)";
    var tags = ["Museum"];
    var ratings = [{"name":"tsoukj","rating":4}];
    
    var new_poi = new poi(oid,userId,latitude,longitude,name,url,tags,ratings);
    pois[oid]=new_poi;
    
    var oid = guid();
    var userId = "tsoukj";
    var latitude = "40.627268";
    var longitude = "22.954664";
    //var name = "Μακεδονικό Μουσείο Σύγχρονης Τέχνης";
    var name = "Macedonian Museum of Contemporary Art";
    var url = "https://en.wikipedia.org/wiki/Macedonian_Museum_of_Contemporary_Art";
    var tags = ["Museum"];
    var ratings = [{"name":"tsoukj","rating":4}];
    
    var new_poi = new poi(oid,userId,latitude,longitude,name,url,tags,ratings);
    pois[oid]=new_poi;
    
    var oid = guid();
    var userId = "tsoukj";
    var latitude = "40.625170";
    var longitude = "22.953909";
    //var name = "Αρχαιολογικό Μουσείο Θεσσαλονίκης";
    var name = "Archaeological Museum of Thessaloniki";
    var url = "https://en.wikipedia.org/wiki/Archaeological_Museum_of_Thessaloniki";
    var tags = ["Museum"];
    var ratings = [{"name":"tsoukj","rating":5}];
    
    var new_poi = new poi(oid,userId,latitude,longitude,name,url,tags,ratings);
    pois[oid]=new_poi;
    
    var oid = guid();
    var userId = "tsoukj";
    var latitude = "40.624414";
    var longitude = "22.959927";
    //var name = "Πολεμικό Μουσείο Θεσσαλονίκης";
    var name = "War Museum of Thessaloniki";
    var url = "https://en.wikipedia.org/wiki/War_Museum_of_Thessaloniki";
    var tags = ["Museum"];
    var ratings = [{"name":"tsoukj","rating":4}];
    
    var new_poi = new poi(oid,userId,latitude,longitude,name,url,tags,ratings);
    pois[oid]=new_poi;
    
    var oid = guid();
    var userId = "tsoukj";
    var latitude = "40.632418";
    var longitude = "22.960451";
    //var name = "Τελλόγλειο Ίδρυμα Τεχνών Α.Π.Θ.";
    var name = "Teloglion Foundation of Art";
    var url = "https://en.wikipedia.org/wiki/Teloglion_Foundation_of_Art";
    var tags = ["Museum"];
    var ratings = [{"name":"tsoukj","rating":3}];
    
    var new_poi = new poi(oid,userId,latitude,longitude,name,url,tags,ratings);
    pois[oid]=new_poi;
    
    var oid = guid();
    var userId = "tsoukj";
    var latitude = "40.610178";
    var longitude = "22.952120";
    //var name = "Λαογραφικό και Εθνολογικό Μουσείο Μακεδονίας-Θράκης";
    var name = "Folk Art and Ethnological Museum of Macedonia and Thrace";
    var url = "https://en.wikipedia.org/wiki/Folk_Art_and_Ethnological_Museum_of_Macedonia_and_Thrace";
    var tags = ["Museum"];
    var ratings = [{"name":"tsoukj","rating":5}];
    
    var new_poi = new poi(oid,userId,latitude,longitude,name,url,tags,ratings);
    pois[oid]=new_poi;
}

function drawPois() {
    
    var poisArray = [];
    
    if(map.hasLayer(poisLayer)){
        map.removeLayer(poisLayer);
    }
    
    for (var key in pois) {
        var dist = calculateDistance(pois[key].latitude,pois[key].longitude,locationObject.userLatitude,locationObject.userLongitude);
        
        if((dist <= range) && ((pois[key].tags.indexOf("Religious Site") != -1 && showReligiousSites)||(pois[key].tags.indexOf("Museum") != -1 && showMuseums)||(pois[key].tags.indexOf("Monument") != -1 && showMonuments)||(pois[key].tags.indexOf("Landmark") != -1 && showLandmarks)||(pois[key].tags.indexOf("Restaurant") != -1 && showRestaurants))) {
            
            var popupText = "<div style='border-radius: 2px; background-color: #fafafa; box-shadow: 0 16px 24px 2px rgba(0,0,0,0.14), 0 6px 30px 5px rgba(0,0,0,0.12), 0 8px 10px -5px rgba(0,0,0,0.4); padding: 5px;'><div><center><b>"+pois[key].name+"</b></center></div><div><center>";
            
            L.AwesomeMarkers.Icon.prototype.options.prefix = 'fa';
            var color = "";
            
            if(pois[key].tags.indexOf("Landmark") != -1){
                color = "purple";
                
                popupText = popupText + "<span style='font-size: 80%; margin-right: 2px; padding: 0 3px 0 3px; color: white; background-color: " + color + "; border: 2px; border-radius: 10%;'><b>Landmark</b></span>";
            }
            
            if(pois[key].tags.indexOf("Monument") != -1){
                color = "orange";
                
                popupText = popupText + "<span style='font-size: 80%; margin-right: 2px; padding: 0 3px 0 3px; color: white; background-color: " + color + "; border: 2px; border-radius: 10%;'><b>Monument</b></span>";
            }
            
            if(pois[key].tags.indexOf("Museum") != -1){
                color = "red";
                
                popupText = popupText + "<span style='font-size: 80%; margin-right: 2px; padding: 0 3px 0 3px; color: white; background-color: " + color + "; border: 2px; border-radius: 10%;'><b>Museum</b></span>";
            }
            
            if(pois[key].tags.indexOf("Religious Site") != -1){
                color = "darkred";
                
                popupText = popupText + "<span style='font-size: 80%; margin-right: 2px; padding: 0 3px 0 3px; color: white; background-color: " + color + "; border: 2px; border-radius: 10%;'><b>Religious Site</b></span>";
            }
            
            if(pois[key].tags.indexOf("Restaurant") != -1){
                color = "darkpurple";
                
                popupText = popupText + "<span style='font-size: 80%; margin-right: 2px; padding: 0 3px 0 3px; color: white; background-color: #663399; border: 2px; border-radius: 10%;'><b>Restaurant</b></span>";
            }
            
            var ratings = getRating(key);
            var rateHTML = "";
            
            if(ratings) {
                var rate = ratings[0];
                var raters = ratings[1];
            
                for(var i=1; i<=5; i++) {
                    if(i<=rate){
                        rateHTML = rateHTML + "<i class='fa fa-star fa-fw fa-lg' style='color: #FFD700; text-shadow: 3px 3px 3px #ccc;'></i>";
                    } else {
                        rateHTML = rateHTML + "<i class='fa fa-star-o fa-fw fa-lg' style='text-shadow: 3px 3px 3px #ccc;'></i>";
                    }
                }
                
                rateHTML = rateHTML + "<br>"+raters+" rating(s)";
            }else{
                rateHTML = "No ratings yet";
            }
            
            popupText = popupText + "</center><center>"+dist.toFixed(1)+" km</center></div><br><span style='white-space:nowrap;'><center>" + rateHTML + "</center></span></div>";
            
            //popupText = popupText + "</center></div><p><span style='white-space:nowrap;'><center><i class='fa fa-star-o fa-fw fa-lg'></i><i class='fa fa-star-o fa-fw fa-lg'></i><i class='fa fa-star-o fa-fw fa-lg'></i><i class='fa fa-star-o fa-fw fa-lg'></i><i class='fa fa-star-o fa-fw fa-lg'></i></center></span></p></div>";
            
            //popupText = popupText + "</div><p><span style='white-space:nowrap;'><ons-icon icon='fa-image' size='24px'></ons-icon> <ons-icon icon='fa-camera' size='24px'></ons-icon> <ons-icon icon='fa-commenting-o' size='24px'></ons-icon></span></p>";
    
            popupText = popupText + "</div><p></p><div style='border-radius: 2px; background-color: #fafafa; box-shadow: 0 16px 24px 2px rgba(0,0,0,0.14), 0 6px 30px 5px rgba(0,0,0,0.12), 0 8px 10px -5px rgba(0,0,0,0.4); padding: 5px;'><span style='white-space:nowrap;'><center><i class='fa fa-info-circle fa-fw fa-2x' style='text-shadow: 3px 3px 3px #ccc;' onClick='openInfo("+JSON.stringify(pois[key].url)+");'></i><i class='fa fa-camera fa-fw fa-2x' style='text-shadow: 3px 3px 3px #ccc;' onClick='photoActions("+JSON.stringify(pois[key].oid)+");'></i><i class='fa fa-commenting-o fa-fw fa-2x' style='text-shadow: 3px 3px 3px #ccc;' onClick='commentActions("+JSON.stringify(pois[key].oid)+")';></i><i class='fa fa-star fa-fw fa-2x' style='text-shadow: 3px 3px 3px #ccc;' onClick='ratingActions("+JSON.stringify(pois[key].oid)+");'></i><i class='fa fa-map-signs fa-fw fa-2x' style='text-shadow: 3px 3px 3px #ccc;' onClick='routingActions("+pois[key].latitude+","+pois[key].longitude+");'></i></center></span></div>";
    
            var markerAtr = L.AwesomeMarkers.icon({
                icon: 'eye',
                markerColor: color
            });
            
            var m = L.marker([pois[key].latitude, pois[key].longitude], {icon: markerAtr, draggable:false}).bindPopup(popupText, {maxWidth:200});
            
            poisArray.push(m);
        }
    }
    
    poisLayer = L.layerGroup(poisArray);
    poisLayer.addTo(map);
} 

function routingActions(targetLat,targetLng) {
    
    drawRoute(targetLat,targetLng);

}

function drawRoute(targetLat,targetLng) {
    
    var routeMode = "";
    
    if (mode == "walk") {
        routeMode = 'pedestrian';
    }else if (mode == "cycling") {
        routeMode = 'bicycle';
    }else if (mode == "transportation") {
        routeMode = 'bus';
    }else if (mode == "drive") {
        routeMode = 'auto';
    }
                    
    if(control){
        control.removeFrom(map);
        control=null;
    }
            
    control = L.Routing.control({
        plan: L.Routing.plan(
            [
                [locationObject.userLatitude,locationObject.userLongitude],
                [targetLat,targetLng]
            ],
            {
                createMarker: function() {
                    return null;
                },
            }),
            
        router: L.Routing.valhalla('valhalla-SUYF90s', routeMode),
        formatter: new L.Routing.Valhalla.Formatter(),
        summaryTemplate:'<div class="start">{name}</div><div class="info {transitmode}">{distance}, {time}</div>',
        lineOptions: {
            styles: [{color: 'black', opacity: 0.15, weight: 9}, {color: 'white', opacity: 0.8, weight: 6}, {color: '#ff0066', opacity: 1, weight: 2}]
        },
        routeWhileDragging: false,
        fitSelectedRoutes: true
    }).addTo(map);
    
    r = control.getRouter();
            
    r.route (control.getWaypoints(), function(err, routes) {
        if (err) {
            showAlertBootbox(err.message,"Route Controller Warning");
        } else {
            document.getElementById("routeInfo").style.display = "inline";
            document.getElementById("cancelRoute").style.display = "inline";
            
            map.closePopup();
            
            if(departureMarker) {
                map.removeLayer(departureMarker);
            }
                    
            L.AwesomeMarkers.Icon.prototype.options.prefix = 'fa';
            
            var markerAtr = L.AwesomeMarkers.icon({
                icon: 'font',
                markerColor: 'green'
            });
            
            departureMarker = L.marker([locationObject.userLatitude,locationObject.userLongitude], {icon: markerAtr}).addTo(map);
            
            var totalDist = routes[0].summary.totalDistance;
            var totalTime = routes[0].summary.totalTime;
            var wp = routes[0].coordinates;
            
            totalDist = (totalDist).toFixed(1) + "km";
            
            if(totalTime < 3600){
                totalTime = parseInt(totalTime/60, 10) + "min";
            } else {
                totalTime = parseInt(totalTime/3600, 10) + "h " + parseInt((totalTime%3600)/60, 10) + "m";
            }
            
            document.getElementById("routeDist").innerHTML = totalDist;
            document.getElementById("routeDur").innerHTML = totalTime;

//             document.getElementById("cancelRoute").style.display = "inline";
//             document.getElementById("routeInfo").style.display = "inline";
//             map.closePopup();
//             popover2.show();
//             
//             if(departureMarker) {
//                 map.removeLayer(departureMarker);
//             }
//                     
//             L.AwesomeMarkers.Icon.prototype.options.prefix = 'fa';
//             
//             var markerAtr = L.AwesomeMarkers.icon({
//                 icon: 'font',
//                 markerColor: 'green'
//             });
//             
//             departureMarker = L.marker([locationObject.userLatitude,locationObject.userLongitude], {icon: markerAtr}).addTo(map);
//             
//             map.off('locationfound', onLocationFound);
//             map.locate({setView: false, maxZoom: 16, watch: true, maximumAge: 300000, timeout: 30000, enableHighAccuracy: true});
//             map.on('locationfound', onLocationTrack);
//             
//             var totalDist = routes[0].summary.totalDistance;
//             var totalTime = routes[0].summary.totalTime;
//             var wp = routes[0].coordinates;
//             
//             totalDist = (totalDist).toFixed(1) + "km";
//             
//             if(totalTime < 3600){
//                 totalTime = parseInt(totalTime/60, 10) + "min";
//             } else {
//                 totalTime = parseInt(totalTime/3600, 10) + "h " + parseInt((totalTime%3600)/60, 10) + "m";
//             }
// 
//             document.getElementById("routeDist").innerHTML = totalDist;
//             document.getElementById("routeDur").innerHTML = totalTime;
        }
    });
}

function cancelRoute() {
    document.getElementById("cancelRoute").style.display = "none";
    document.getElementById("routeInfo").style.display = "none";

    if(control){
        control.removeFrom(map);
        control=null;
    }
    
    if(departureMarker) {
        map.removeLayer(departureMarker);
    }
}

function photoActions(oid) {
    selectedPoi = oid;
    
    if(!freeze){
        freeze=true; 
        bootbox.dialog({
            closeButton: false,
            title: "<center><b>Photos</b></center>",
            message: "What would you like to do?",
            className: modalClass,
            buttons: {
                success: {
                    label: "<i class='fa fa-photo'></i> Gallery",
                    className: "btn-success",
                    callback: function () {
                        bootbox.hideAll();
                        freeze=false;  
                        
                        loadPhotosFromDb();
                    }
                },main: {
                    label: "<i class='fa fa-cloud-upload'></i> Upload",
                    className: "btn-success",
                    callback: function () {
                        bootbox.hideAll();
                        freeze=false; 
                        
                        uploadPhoto();
                    }
                },cancel: {
                    label: "Close",
                    className: "btn-default",
                    callback: function () {
                        bootbox.hideAll();
                        freeze=false;
                    }
                }
            }            
        });                
    }        
}

function uploadPhoto() {
    if(!freeze){
        freeze=true; 
        bootbox.dialog({
            closeButton: false,
            title: "<center><b>Upload Photo</b></center>",
            message: "Add a new photo from:",
            className: modalClass,
            buttons: {
                success: {
                    label: "<i class='fa fa-photo'></i> Album",
                    className: "btn-success",
                    callback: function () {
                        //sendReport();
                        navigator.camera.getPicture(onSuccessPhoto, onFailPhoto, { 
                            quality: 40,destinationType: Camera.DestinationType.DATA_URL,
                            sourceType: navigator.camera.PictureSourceType.SAVEDPHOTOALBUM,
                            encodingType: Camera.EncodingType.JPEG,targetWidth: 400,targetHeight: 400,
                            allowEdit: true
                        }); 
                        bootbox.hideAll();
                        freeze=false;                                        
                    }
                },main: {
                    label: "<i class='fa fa-camera'></i> Camera",
                    className: "btn-success",
                    callback: function () {
                        //sendReport();
                        navigator.camera.getPicture(onSuccessPhoto, onFailPhoto, { 
                            quality: 40,destinationType: Camera.DestinationType.DATA_URL,
                            sourceType: navigator.camera.PictureSourceType.CAMERA,
                            encodingType: Camera.EncodingType.JPEG,targetWidth: 400,targetHeight: 400,
                            allowEdit: true
                        });
                        bootbox.hideAll();
                        freeze=false;                                        
                    }
                },cancel: {
                    label: "Cancel",
                    className: "btn-default",
                    callback: function () {
                        bootbox.hideAll();
                        freeze=false;
                    }
                }
            }            
        });
    }
}

function onSuccessPhoto(imageURI) {
    userName = window.localStorage.getItem("userName");
    imageBase64 = "data:image/jpeg;base64," + imageURI;
    
    uploadPhotoToDb(userName,imageBase64)
} 

function onFailPhoto(message) {
    showAlertBootbox(message,"Error");
}

function showGallery() {
    var empty = true;
    
    var imagesHTML = "";
    var indicatorsHTML = "";
    var count = 0;
    var text = "";
    
    for(var key in galleries){ 
        empty = false;
        
        if(count == 0){
            imagesHTML = imagesHTML+'<div class="item active"><img src="'+galleries[key].src+'" style="max-width: 100%; max-height: 100%;"></div>';
                    
            indicatorsHTML = indicatorsHTML+'<li data-target="#myCarousel" data-slide-to="'+count+'" class="active"></li>';
        }else{
            imagesHTML = imagesHTML+'<div class="item">'+
                        '<img src="'+galleries[key].src+'" style="max-width: 100%; max-height: 100%;">'+
                    '</div>';
                    
            indicatorsHTML = indicatorsHTML+'<li data-target="#myCarousel" data-slide-to="'+count+'"></li>';
        }
        
        count = count + 1;
    } 
    
    if (!empty){
        text = '<div class="container">'+
                        '<br>'+
                        '<div id="myCarousel" class="carousel slide" data-ride="carousel" style="max-height: 300px; overflow-y:scroll;">'+
                            '<ol class="carousel-indicators">'+
                                indicatorsHTML+
                            '</ol>'+
                            '<div class="carousel-inner" role="listbox">'+
                                imagesHTML+
                            '</div>'+
                        '<a class="left carousel-control" href="#myCarousel" role="button" data-slide="prev">'+
                            '<span class="fa fa-chevron-left" aria-hidden="true"></span>'+
                            '<span class="sr-only">Previous</span>'+
                        '</a>'+
                        '<a class="right carousel-control" href="#myCarousel" role="button" data-slide="next">'+
                            '<span class="fa fa-chevron-right" aria-hidden="true"></span>'+
                            '<span class="sr-only">Next</span>'+
                        '</a>'+
                    '</div>'+
                    '</div>';
    }else{
        text = "<center>Gallery Empty</center>";
    }
    
    if(!freeze){
        freeze=true;
    
        bootbox.dialog({
            closeButton: false,
            title: "<center><b>Gallery</b></center>",
            message: text,
            
            className: modalClass,
            buttons: {
                cancel: {
                    label: "Close",
                    className: "btn-default",
                    callback: function () {
                        bootbox.hideAll();
                        freeze=false;
                    }
                }
            }
        });
    }
}

function showPoisDialog() {
    
    var t1 = "";
    var t2 = "";
    var t3 = "";
    var t4 = "";
    var t5 = "";
    
    if (showMuseums) t1 = "checked"; 
    if (showMonuments) t2 = "checked"; 
    if (showLandmarks) t3 = "checked"; 
    if (showReligiousSites) t4 = "checked"; 
    if (showRestaurants) t5 = "checked"; 

    if(!freeze){
        freeze=true; 
        bootbox.dialog({
            closeButton: false, 
            title: "<center><b>POIs</b></center>",
            message: '<div class="row">'+
                    '<div class="col-xs-12 ">'+
                        '<label class="checkbox checkbox--list-item">'+
                          '<input type="checkbox" id="showMuseums" '+t1+'>'+
                          '<div class="checkbox__checkmark checkbox--list-item__checkmark"></div>'+
                          '&nbspShow Museums'+
                        '</label>'+
                        '<label class="checkbox checkbox--list-item">'+
                          '<input type="checkbox" id="showMonuments" '+t2+'>'+
                          '<div class="checkbox__checkmark checkbox--list-item__checkmark"></div>'+
                          '&nbspShow Monuments'+
                        '</label>'+
                        '<label class="checkbox checkbox--list-item">'+
                          '<input type="checkbox" id="showLandmarks" '+t3+'>'+
                          '<div class="checkbox__checkmark checkbox--list-item__checkmark"></div>'+
                          '&nbspShow Landmarks'+
                        '</label>'+
                        '<label class="checkbox checkbox--list-item">'+
                          '<input type="checkbox" id="showReligiousSites" '+t4+'>'+
                          '<div class="checkbox__checkmark checkbox--list-item__checkmark"></div>'+
                          '&nbspShow Religious Sites'+
                        '</label>'+
                        '<label class="checkbox checkbox--list-item">'+
                          '<input type="checkbox" id="showRestaurants" '+t5+'>'+
                          '<div class="checkbox__checkmark checkbox--list-item__checkmark"></div>'+
                          '&nbspShow Restaurants'+
                        '</label>'+
                        '<p>Range</p>'+
                        '<div>'+
                        '<span>'+
                            '<input type="range" id="rangeBar" style="float: right; width: 150px; margin-top: -4px;" min="1" max="10" value="'+range+'" onchange="document.getElementById(&#39;range&#39;).innerHTML = this.value">'+
                            '<i class="fa fa-globe" style="font-size: 24px; opacity: 0.6"></i>'+ 
                            '<span id="range">'+range+'</span><span>km</span>'+
                            '</span>'+
                        '</div>'+
                    '</div>'+
                    '</div>',
                

            className: modalClass,
            buttons: {
                success: {
                    label: "<i class='fa fa-save'></i> Save",
                    className: "btn-success",
                    callback: function () {
                                                
                        if (document.getElementById("showMuseums").checked == true) {
                            showMuseums = true;
                        }else{
                            showMuseums = false;
                        };
                        
                        if (document.getElementById("showMonuments").checked == true) {
                            showMonuments = true;
                        }else{
                            showMonuments = false;
                        };
                        
                        if (document.getElementById("showLandmarks").checked == true) {
                            showLandmarks = true;
                        }else{
                            showLandmarks = false;
                        };
                        
                        if (document.getElementById("showReligiousSites").checked == true) {
                            showReligiousSites = true;
                        }else{
                            showReligiousSites = false;
                        }; 
                        
                        if (document.getElementById("showRestaurants").checked == true) {
                            showRestaurants = true;
                        }else{
                            showRestaurants = false;
                        }; 
                        
                        range = document.getElementById("rangeBar").value;
                        
                        window.localStorage.setItem("range", range);
                        
                        loadPoisFromDb();
                            
        
                            bootbox.hideAll();
                            freeze=false;
                        }
                    },cancel:{
                        label: "Cancel",
                        className: "btn-default",
                        callback: function () {
                            bootbox.hideAll();
                            freeze=false;
                        }
                    }
                }
            }
        );
    }
    
}

function newPoiPrompt(){
    
    var poiHTML =
                '<b>POI Name: </b>'+
                '<input type="text" class="form-control" id="poiName" placeholder="Enter name" style="margin-bottom: 4px;">'+
                '<hr style="margin-bottom: 3px; margin-top: 2px;">'+
                '<b>POI Info URL: </b>'+
                '<input type="text" class="form-control" id="poiUrl" placeholder="Optional - Enter a URL providing info" style="margin-bottom: 4px;">'+
                '<hr style="margin-bottom: 3px; margin-top: 2px;">'+
                '<b>POI tags (choose at least one):</b>'+
                '<div class="row">'+
                    '<div class="col-xs-12 ">'+
                        '<label class="checkbox checkbox--list-item">'+
                          '<input type="checkbox" id="tagMuseum">'+
                          '<div class="checkbox__checkmark checkbox--list-item__checkmark"></div>'+
                          '&nbspMuseum'+
                        '</label>'+
                        '<label class="checkbox checkbox--list-item">'+
                          '<input type="checkbox" id="tagMonument">'+
                          '<div class="checkbox__checkmark checkbox--list-item__checkmark"></div>'+
                          '&nbspMonument'+
                        '</label>'+
                        '<label class="checkbox checkbox--list-item">'+
                          '<input type="checkbox" id="tagLandmark">'+
                          '<div class="checkbox__checkmark checkbox--list-item__checkmark"></div>'+
                          '&nbspLandmark'+
                        '</label>'+
                        '<label class="checkbox checkbox--list-item">'+
                          '<input type="checkbox" id="tagReligiousSite">'+
                          '<div class="checkbox__checkmark checkbox--list-item__checkmark"></div>'+
                          '&nbspReligious Site'+
                        '</label>'+
                        '<label class="checkbox checkbox--list-item">'+
                          '<input type="checkbox" id="tagRestaurant">'+
                          '<div class="checkbox__checkmark checkbox--list-item__checkmark"></div>'+
                          '&nbspRestaurant'+
                        '</label>'+
                    '</div>'+
                '</div>';
    if(!freeze){
        freeze=true;  
        bootbox.dialog({
            closeButton: false,
            title: "<center><b>New POI Details</b></center>",
            message: poiHTML,
            className: modalClass,
            buttons: {
                success: {
                    label: "<i class='fa fa-map-pin'></i> Create",
                    className: "btn-success",
                    callback: function () {
                        var l=map.getCenter();
                        userName = window.localStorage.getItem("userName");
                        
                        var oid = guid();
                        var userId = userName;
                        var latitude = l.lat;
                        var longitude = l.lng;
                        var name = "";
                        var url = "";
                        var tags = [];
                        var empty = true;
                        var empty2 = true;
                        
                        if(document.getElementById("poiName").value != "") {
                            name = document.getElementById("poiName").value;
                            empty2 = false;
                        }
                        
                        if(document.getElementById("poiUrl").value != "") {
                            url = document.getElementById("poiUrl").value;
                        }
                        
                        if(document.getElementById("tagMuseum").checked == true) {
                            tags.push("Museum");
                            empty = false;
                        }
                        
                        if(document.getElementById("tagMonument").checked == true) {
                            tags.push("Monument");
                            empty = false;
                        }
                        
                        if(document.getElementById("tagLandmark").checked == true) {
                            tags.push("Landmark");
                            empty = false;
                        }
                        
                        if(document.getElementById("tagReligiousSite").checked == true) {
                            tags.push("Religious Site");
                            empty = false;
                        }
                        
                        if(document.getElementById("tagRestaurant").checked == true) {
                            tags.push("Restaurant");
                            empty = false;
                        }
                        
                        var ratings = [];
                        
                        if(!empty && !empty2) {
                            
                            var new_poi = new poi(oid,userId,latitude,longitude,name,url,tags,ratings);
                            pois[oid]=new_poi;
                            
                            bootbox.hideAll();
                            freeze=false;
                            
                            uploadPoiToDb(new_poi);
                            
                            loadPoisFromDb();
 
                        }else{
                            bootbox.hideAll();
                            freeze=false;
                            
                            bootbox.dialog({
                                closeButton: false,
                                title: "Please Retry",
                                message: "POI tag(s) or name missing.",
                                className: modalClass,
                                buttons: {
                                    success: {
                                        label: "Retry",
                                        className: "btn-success",
                                        callback: function () {
                                            newPoiPrompt();
                                        }
                                    }
                                }
                            });
                    
                            //showAlertBootbox("POI tag(s) missing","Please Retry");
                            
                        }

                    }    
                },cancel:{
                    label: "Cancel",
                    className: "btn-default",
                    callback: function () {
                        bootbox.hideAll();
                        freeze=false;
                    }
                }
            }
        });
    }      
}

function commentActions(oid) {
    selectedPoi = oid;
        
    loadCommentsFromDb();
}

function sendComment() {
    var comment = document.getElementById("commentInput").value;
    userName = window.localStorage.getItem("userName");
    
    document.getElementById("commentInput").value = "";
    
    if(comment!="") {
        //var d = new Date();
               
        //comments.push({"comment":{"poiId":selectedPoi,"userId":userName,"text":comment,"time":d.toDateString()}});
        
        uploadCommentToDb(userName,comment)
        
    }else{
        showAlertBootbox("Comment body can't be empty!","Warning");
    }
}

function showComments() {
    var text = '<div class="container">'+
                '<ul class="list-group" style="max-height: 300px; overflow-y:scroll;">';
    var empty = true;
    
    for(var key in comments){ 
            
        text = text + '<li class="list-group-item">'+
                            '<div class="timeline-date">'+comments[key].time+'</div>'+
                            '<div class="timline-from">'+
                                '<span class="timeline-id">@'+comments[key].userId+'</span>'+
                            '</div>'+
                            '<div class="timeline-message">'+
                                comments[key].text+
                            '</div>'+
                        '</li>';
        empty = false;
    }
    
    if(empty){
        text =  text + '<li class="list-group-item">'+
                            '<div class="timeline-message">'+
                                '<i>No comments yet</i>'+
                            '</div>'+
                        '</li>';
    }
    
    text = text + '</ul>'+
                    '</div>'+
                    '<textarea class="form-control" rows="2" id="commentInput" placeholder="Type your comment here"></textarea>';
                
    
    if(!freeze){
        freeze=true;
    
        bootbox.dialog({
            closeButton: false,
            title: "<center><b>Comments</b></center>",
            message: text,
            
            className: modalClass,
            buttons: {
                success: {
                    label: "<i class='fa fa-send'></i> Post",
                    className: "btn-success",
                    callback: function () {
                        bootbox.hideAll();
                        freeze=false;
                        sendComment();
                    }
                },cancel: {
                    label: "Close",
                    className: "btn-default",
                    callback: function () {
                        bootbox.hideAll();
                        freeze=false;
                    }
                }
            }
        });
    }
}

function createPlan() {
    
    if(!freeze){
        freeze=true; 
        bootbox.dialog({
            closeButton: false, 
            title: "<center><b>Plan Preferences</b></center>",
            message: '<div class="row">'+
                    '<div class="col-xs-12 ">'+
                        '<b>Places to Visit:</b>'+
                        '<label class="checkbox checkbox--list-item">'+
                          '<input type="checkbox" id="museums">'+
                          '<div class="checkbox__checkmark checkbox--list-item__checkmark"></div>'+
                          '&nbspMuseums'+
                        '</label>'+
                        '<label class="checkbox checkbox--list-item">'+
                          '<input type="checkbox" id="monuments">'+
                          '<div class="checkbox__checkmark checkbox--list-item__checkmark"></div>'+
                          '&nbspMonuments'+
                        '</label>'+
                        '<label class="checkbox checkbox--list-item">'+
                          '<input type="checkbox" id="landmarks">'+
                          '<div class="checkbox__checkmark checkbox--list-item__checkmark"></div>'+
                          '&nbspLandmarks'+
                        '</label>'+
                        '<label class="checkbox checkbox--list-item">'+
                          '<input type="checkbox" id="religiousSites">'+
                          '<div class="checkbox__checkmark checkbox--list-item__checkmark"></div>'+
                          '&nbspReligious Sites'+
                        '</label>'+
                        '<label class="checkbox checkbox--list-item">'+
                          '<input type="checkbox" id="restaurants">'+
                          '<div class="checkbox__checkmark checkbox--list-item__checkmark"></div>'+
                          '&nbspRestaurants'+
                        '</label>'+
                        '<p><b>Maximun Number of Places:</b></p>'+
                        '<div>'+
                        '<span>'+
                            '<input type="range" id="numberBar" style="float: right; width: 150px; margin-top: -4px;" min="1" max="20" value="5" onchange="document.getElementById(&#39;number&#39;).innerHTML = this.value">'+
                            '<i class="fa fa-university fa-fw" style="font-size: 24px; opacity: 0.6"></i>'+ 
                            '<span id="number">5</span><span> places</span>'+
                            '</span>'+
                        '</div><br>'+
                        '<p><b>Maximun Range</b></p>'+
                        '<div>'+
                        '<span>'+
                            '<input type="range" id="inRangeBar" style="float: right; width: 150px; margin-top: -4px;" min="1" max="10" value="5" onchange="document.getElementById(&#39;inRange&#39;).innerHTML = this.value">'+
                            '<i class="fa fa-globe fa-fw" style="font-size: 24px; opacity: 0.6"></i>'+ 
                            '<span id="inRange">5</span><span>km</span>'+
                            '</span>'+ 
                        '</div><br>'+
                        '<p><b>Average Total Time:</b></p>'+
                        '<div>'+
                        '<span>'+
                            '<input type="range" id="totalTimeBar" style="float: right; width: 150px; margin-top: -4px;" min="1" max="10" value="2" onchange="document.getElementById(&#39;totalTime&#39;).innerHTML = this.value">'+
                            '<i class="fa fa-clock-o fa-fw" style="font-size: 24px; opacity: 0.6"></i>'+ 
                            '<span id="totalTime">2</span><span>hrs</span>'+
                            '</span>'+
                        '</div><br>'+
                        '<p><b>Time Spent on each Place:</b></p>'+
                        '<div>'+
                        '<span>'+
                            '<input type="range" id="spendTimeBar" style="float: right; width: 150px; margin-top: -4px;" min="10" max="120" step="10" value="30" onchange="document.getElementById(&#39;spendTime&#39;).innerHTML = this.value">'+
                            '<i class="fa fa-clock-o fa-fw" style="font-size: 24px; opacity: 0.6"></i>'+ 
                            '<span id="spendTime">30</span><span>min</span>'+
                            '</span>'+
                        '</div>'+
                    '</div>'+
                    '</div>',
                
            className: modalClass,
            buttons: {
                success: {
                    label: "<i class='fa fa-calendar'></i> Create",
                    className: "btn-success",
                    callback: function () {

                        showMuseums = false;
                        showMonuments = false;
                        showLandmarks = false;
                        showReligiousSites = false;
                        showRestaurants = false;
                                                
                        if(document.getElementById("museums").checked == true) {
                            var museums = true;
                            showMuseums = true;
                        }
                        if(document.getElementById("monuments").checked == true) {
                            var monuments = true;
                            showMonuments = true;
                        }
                        if(document.getElementById("landmarks").checked == true) {
                            var landmarks = true;
                            showLandmarks = true;
                        }
                        if(document.getElementById("religiousSites").checked == true) {
                            var religiousSites = true;
                            showReligiousSites = true;
                        }
                        if(document.getElementById("restaurants").checked == true) {
                            var restaurants = true;
                            showRestaurants = true;
                        }
                    
                        planPois = [];
                        var range = document.getElementById("inRangeBar").value;
                        var number = document.getElementById("numberBar").value;
                        spendTime = parseInt(document.getElementById("spendTime").innerHTML);
                        var totalTime = document.getElementById("totalTimeBar").value * 60;
                        var pushedRestaurant = false;
                        
                        for (var key in pois){
                            if((museums && pois[key].tags.indexOf("Museum") != -1) || (monuments && pois[key].tags.indexOf("Monument") != -1) || (landmarks && pois[key].tags.indexOf("Landmark") != -1) || (religiousSites && pois[key].tags.indexOf("Religious Site") != -1) || (restaurants && pois[key].tags.indexOf("Restaurant") != -1)){
                                var dist = calculateDistance(pois[key].latitude,pois[key].longitude,locationObject.userLatitude,locationObject.userLongitude);

                                if (dist <= range) {
                                    if (pois[key].tags.indexOf("Restaurant") != -1) {
                                        if(!pushedRestaurant){
                                            planPois.push({"poi":pois[key],"distance":dist});
                                            pushedRestaurant = true;
                                        }
                                    }else{
                                        planPois.push({"poi":pois[key],"distance":dist});
                                    }
                                    
                                }
                            }
                        }
                        
                        if(planPois.length > 0){
                            planPois.sort(function(a, b){return a.distance-b.distance});
                            
                            //http://stackoverflow.com/questions/18280420/rearrange-a-list-of-points-to-reach-the-shortest-distance-between-them
//                             temp = []
//                             path = [planPois[0]]
//                             
//                             for (var i=0; i<planPois.length; i++){
//                                 for (var j=0; j<planPois.length; j++){
//                                     if (j!=i && path.indexOf(planPois[j])==-1){
//                                         var dist = calculateDistance(planPois[i].poi.latitude,planPois[i].poi.longitude,planPois[j].poi.latitude,planPois[j].poi.longitude);
//                                         temp.push({"poi":planPois[j],"distance":dist});
//                                     }
//                                     
//                                     
//                                 }
//                                     // var lowest = Number.POSITIVE_INFINITY;
//                                     // var tmp;
//                                     // for (var i=temp.length-1; i>=0; i--) {
//                                     //     tmp = temp[i].distance;
//                                     //     if (tmp.distance < lowest.distance) lowest = temp[i];
//                                     // }
//                                     // console.log(lowest)
//                                     
//                                 temp.sort(function(a, b){return a.distance-b.distance}); 
// 
//                                 path.push(temp[0]);
//                             } 
//                             console.log(JSON.stringify(path));
//                             //planPois = path;
                                
                            if (planPois.length > number){
                                planPois.splice(number, planPois.length - number);
                            }  
                            
                            var placesByTime = parseInt(totalTime / (spendTime + transitionTimeBetweenPlaces));
                            
                            if (planPois.length > placesByTime){
                                planPois.splice(placesByTime, planPois.length - placesByTime);
                            }
                                                        
                            bootbox.hideAll();
                            freeze=false;
                            
                            showPlan();
                        
                        } else {
                            bootbox.hideAll();
                            freeze=false;
                            
                            bootbox.dialog({
                                closeButton: false,
                                title: "No Places Found",
                                message: "Please select more place types or increase range.",
                                className: modalClass,
                                buttons: {
                                    success: {
                                        label: "Retry",
                                        className: "btn-success",
                                        callback: function () {
                                            createPlan();
                                        }
                                    }
                                }
                            });
                        }

                        }
                    },cancel:{
                        label: "Cancel",
                        className: "btn-default",
                        callback: function () {
                            bootbox.hideAll();
                            freeze=false;
                        }
                    }
                }
            }
        );
    }
}

function showPlan() {
    var modeHTML = "";
    
    if (mode == 'walk') {
        modeHTML = "Walking";
    }else if (mode == 'cycling') {
        modeHTML = "Cycling";
    }else if (mode == 'bus') {
        modeHTML = "Bus";
    }else if (mode == 'drive') {
        modeHTML = "Driving";
    }
    
    calculateDistAndTime();
    
    var text =  '<div style="color: red;"><center><b>'+planPois.length+' places selected</b></center></div>'+
                '<div class="row">'+
                '<div class="col-xs-4">'+
                '<center><span><b>Total Distance:<br></b> <span id="totalDist"><i class="fa fa-refresh fa-spin"></i></span></span></center>'+
                '</div>'+
                '<div class="col-xs-4">'+
                '<center><span><b>'+modeHTML+' Time:<br></b> <span id="totalTime"><i class="fa fa-refresh fa-spin"></i></span></span></center>'+
                '</div>'+
                '<div class="col-xs-4">'+
                '<center><span><b>Total Time:<br></b> <span id="totalTime2"><i class="fa fa-refresh fa-spin"></i></span></span></center>'+
                '</div>'+
                '</div>'+
                '<div class="container">'+
                '<ul id="pois_list" class="list-group" style="max-height: 230px; overflow-y:scroll;">';
    
    for(var key in planPois){ 
        
        var ratings = getRating(planPois[key].poi.oid);
        var rateHTML = "";
        
        if(ratings) {
            var rate = ratings[0];
            
            for(var i=1; i<=5; i++) {
                if(i<=rate){
                    rateHTML = rateHTML + "<i class='fa fa-star fa-fw fa-lg' style='color: #FFD700; text-shadow: 3px 3px 3px #ccc;'></i>";
                } else {
                    rateHTML = rateHTML + "<i class='fa fa-star-o fa-fw fa-lg' style='text-shadow: 3px 3px 3px #ccc;'></i>";
                }
            }
        }else{
            rateHTML = "No ratings yet";
        }
        
        var jkey = planPois[key].poi.oid;
        
        text = text + '<li class="list-group-item" id='+"'"+jkey+"'"+' style = "margin: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.2); ">'+
                            planPois[key].poi.name+'<br>'+
                            '<span style="font-size: 80%;">'+rateHTML+'</span> <span style="opacity: 0.6; font-size: 80%;">'+ planPois[key].distance.toFixed(1) + 'km</span>' +
                            '<center><i class="fa fa-times fa-lg" onClick="removePoiFromPlan('+"'"+jkey+"'"+');"></i></center>'+
                        '</li>';     
                        
    }

    text = text + '</ul>'+
                    '</div>';
                
    
    if(!freeze){
        freeze=true;
    
        bootbox.dialog({
            closeButton: false,
            title: "<center><b>My Plan</b></center>",
            message: text,
            
            className: modalClass,
            buttons: {
                success: {
                    label: "<i class='fa fa-map-signs'></i> Show on Map",
                    className: "btn-success showMap",
                    callback: function () {
                        bootbox.hideAll();
                        freeze=false;
                        drawPlan();
                    }
                },cancel: {
                    label: "Close",
                    className: "btn-default",
                    callback: function () {
                        bootbox.hideAll();
                        freeze=false;
                    }
                }
            }
        });
    }

}

function removePoiFromPlan(oid) {
    
    if (planPois.length > 1){
        bootbox.dialog({
            closeButton: false,
            title: "Confirm",
            message: "This place will be removed from your plan.",
            className: modalClass,
            buttons: {
                success: {
                    label: "Ok",
                    className: "btn-success",
                    callback: function () {
                        document.getElementById("pois_list").removeChild(document.getElementById(oid));
                        
                        document.getElementById("totalDist").innerHTML = '<i class="fa fa-refresh fa-spin"></i>';
                        document.getElementById("totalTime").innerHTML = '<i class="fa fa-refresh fa-spin"></i>';
                        document.getElementById("totalTime2").innerHTML = '<i class="fa fa-refresh fa-spin"></i>';

                        $(".showMap").hide();
            
                        for (var key in planPois){
                            if (planPois[key].poi.oid == oid) {
                            
                                var ind = planPois.indexOf(planPois[key]);
                                
                                planPois.splice(ind, 1);
                                calculateDistAndTime();
                            }
                        }
                        
                    }
                },cancel: {
                    label: "Cancel",
                    className: "btn-default",
                    callback: function () {
                    }
                }
            }
        });
        
    } else {
        bootbox.dialog({
            closeButton: false,
            title: "Warning",
            message: "If you remove all places, your plan will be cancelled. Are you sure?",
            className: modalClass,
            buttons: {
                success: {
                    label: "Ok",
                    className: "btn-success",
                    callback: function () {
                        bootbox.hideAll();
                        freeze=false;
                    }
                },cancel: {
                    label: "Cancel",
                    className: "btn-default",
                    callback: function () {
                        bootbox.hideAll();
                        freeze=false;
                        
                        showPlan();
                    }
                }
            }
        });
    }
}

function calculateDistAndTime() {
    $(".showMap").hide();
    
    var totalDist = "";
    var totalTime = "";
    var totalTime2 = "";
    var routeMode = "";
    
    if (mode == "walk") {
        routeMode = 'pedestrian';
    }else if (mode == "cycling") {
        routeMode = 'bicycle';
    }else if (mode == "transportation") {
        routeMode = 'bus';
    }else if (mode == "drive") {
        routeMode = 'auto';
    }
    
    var wp = [[locationObject.userLatitude,locationObject.userLongitude]];
        
    for (var key in planPois){
        wp.push([planPois[key].poi.latitude,planPois[key].poi.longitude]);
    }
    
    if(control){
        control.removeFrom(map);
        control=null;
    }
    
    control = L.Routing.control({
        waypoints: wp,
        createMarker: function() {
            return null;
        },
             
        router: L.Routing.valhalla('valhalla-SUYF90s', routeMode),
        formatter: new L.Routing.Valhalla.Formatter(),
        summaryTemplate:'<div class="start">{name}</div><div class="info {transitmode}">{distance}, {time}</div>'
    }).addTo(map);
    
    r = control.getRouter();
            
    r.route (control.getWaypoints(), function(err, routes) {
        if (err) {
            document.getElementById("totalDist").innerHTML = "N/A";
            document.getElementById("totalTime").innerHTML = "N/A";
            document.getElementById("totalTime2").innerHTML = "N/A"; 
        } else {
            totalDist = routes[0].summary.totalDistance;
            totalTime = routes[0].summary.totalTime;
            totalTime2 = totalTime + planPois.length*spendTime*60;
            var wp = routes[0].coordinates;
            
            totalDist = (totalDist).toFixed(1) + "km";
            
            if(totalTime < 3600){
                totalTime = parseInt(totalTime/60, 10) + "min";
            } else {
                totalTime = parseInt(totalTime/3600, 10) + "h " + parseInt((totalTime%3600)/60, 10) + "m";
            }
            
            if(totalTime2 < 3600){
                totalTime2 = parseInt(totalTime2/60, 10) + "min";
            } else {
                totalTime2 = parseInt(totalTime2/3600, 10) + "h " + parseInt((totalTime2%3600)/60, 10) + "m";
            }
            
            if(control){
                control.removeFrom(map);
                control=null;
            }
            
            document.getElementById("totalDist").innerHTML = totalDist;
            document.getElementById("totalTime").innerHTML = totalTime;
            document.getElementById("totalTime2").innerHTML = totalTime2;
            
            $(".showMap").show();

        }
    });
}

function drawPlan() { 

    var routeMode = "";
    
    if (mode == "walk") {
        routeMode = 'pedestrian';
    }else if (mode == "cycling") {
        routeMode = 'bicycle';
    }else if (mode == "transportation") {
        routeMode = 'bus';
    }else if (mode == "drive") {
        routeMode = 'auto';
    }
    
    var wp = [[locationObject.userLatitude,locationObject.userLongitude]];

    for (var key in planPois){
        wp.push([planPois[key].poi.latitude,planPois[key].poi.longitude]);
    }
        
    if(control){
        control.removeFrom(map);
        control=null;
    }
    
    //wp.unshift([]);
    
    control = L.Routing.control({
        waypoints: wp,
        createMarker: function() {
            return null;
        }, 
                
        router: L.Routing.valhalla('valhalla-SUYF90s', routeMode),
        formatter: new L.Routing.Valhalla.Formatter(),
        summaryTemplate:'<div class="start">{name}</div><div class="info {transitmode}">{distance}, {time}</div>',
        lineOptions: {
            styles: [{color: 'black', opacity: 0.15, weight: 9}, {color: 'white', opacity: 0.8, weight: 6}, {color: '#ff0066', opacity: 1, weight: 2}]
        },
        routeWhileDragging: false,
        fitSelectedRoutes: true
    }).addTo(map);
    
    r = control.getRouter();
            
    r.route (control.getWaypoints(), function(err, routes) {
        if (err) {
           showAlertBootbox(err.message,"Route Controller Warning"); 
        } else {
            var poisArray = [];
    
            if(map.hasLayer(poisLayer)){
                map.removeLayer(poisLayer);
            }
            
            var counter = 1;
            
            for (var key in planPois) {
                var dist = calculateDistance(planPois[key].poi.latitude,planPois[key].poi.longitude,locationObject.userLatitude,locationObject.userLongitude);
                                    
                var popupText = "<div style='border-radius: 2px; background-color: #fafafa; box-shadow: 0 16px 24px 2px rgba(0,0,0,0.14), 0 6px 30px 5px rgba(0,0,0,0.12), 0 8px 10px -5px rgba(0,0,0,0.4); padding: 5px;'><div><center><b>"+planPois[key].poi.name+"</b></center></div><div><center>";
                
                L.AwesomeMarkers.Icon.prototype.options.prefix = 'fa';
                var color = "";
                
                if(planPois[key].poi.tags.indexOf("Landmark") != -1){
                    color = "purple";
                    
                    popupText = popupText + "<span style='font-size: 80%; margin-right: 2px; padding: 0 3px 0 3px; color: white; background-color: " + color + "; border: 2px; border-radius: 10%;'><b>Landmark</b></span>";
                }
                
                if(planPois[key].poi.tags.indexOf("Monument") != -1){
                    color = "orange";
                    
                    popupText = popupText + "<span style='font-size: 80%; margin-right: 2px; padding: 0 3px 0 3px; color: white; background-color: " + color + "; border: 2px; border-radius: 10%;'><b>Monument</b></span>";
                }
                
                if(planPois[key].poi.tags.indexOf("Museum") != -1){
                    color = "red";
                    
                    popupText = popupText + "<span style='font-size: 80%; margin-right: 2px; padding: 0 3px 0 3px; color: white; background-color: " + color + "; border: 2px; border-radius: 10%;'><b>Museum</b></span>";
                }
                
                if(planPois[key].poi.tags.indexOf("Religious Site") != -1){
                    color = "darkred";
                    
                    popupText = popupText + "<span style='font-size: 80%; margin-right: 2px; padding: 0 3px 0 3px; color: white; background-color: " + color + "; border: 2px; border-radius: 10%;'><b>Religious Site</b></span>";
                }
                
                if(planPois[key].poi.tags.indexOf("Restaurant") != -1){
                    color = "darkpurple";
                    
                    popupText = popupText + "<span style='font-size: 80%; margin-right: 2px; padding: 0 3px 0 3px; color: white; background-color: #663399; border: 2px; border-radius: 10%;'><b>Restaurant</b></span>";
                }
                
                var ratings = getRating(planPois[key].poi.oid);
                var rateHTML = "";
                
                if(ratings) {
                    var rate = ratings[0];
                    var raters = ratings[1];
                
                    for(var i=1; i<=5; i++) {
                        if(i<=rate){
                            rateHTML = rateHTML + "<i class='fa fa-star fa-fw fa-lg' style='color: #FFD700; text-shadow: 3px 3px 3px #ccc;'></i>";
                        } else {
                            rateHTML = rateHTML + "<i class='fa fa-star-o fa-fw fa-lg' style='text-shadow: 3px 3px 3px #ccc;'></i>";
                        }
                    }
                    
                    rateHTML = rateHTML + "<br>"+raters+" rating(s)";
                }else{
                    rateHTML = "No ratings yet";
                }
                
                popupText = popupText + "</center><center>"+dist.toFixed(1)+" km</center></div><br><span style='white-space:nowrap;'><center>" + rateHTML + "</center></span></div>";
                
                //popupText = popupText + "</center></div><p><span style='white-space:nowrap;'><center><i class='fa fa-star-o fa-fw fa-lg'></i><i class='fa fa-star-o fa-fw fa-lg'></i><i class='fa fa-star-o fa-fw fa-lg'></i><i class='fa fa-star-o fa-fw fa-lg'></i><i class='fa fa-star-o fa-fw fa-lg'></i></center></span></p></div>";
                
                //popupText = popupText + "</div><p><span style='white-space:nowrap;'><ons-icon icon='fa-image' size='24px'></ons-icon> <ons-icon icon='fa-camera' size='24px'></ons-icon> <ons-icon icon='fa-commenting-o' size='24px'></ons-icon></span></p>";
        
                popupText = popupText + "</div><p></p><div style='border-radius: 2px; background-color: #fafafa; box-shadow: 0 16px 24px 2px rgba(0,0,0,0.14), 0 6px 30px 5px rgba(0,0,0,0.12), 0 8px 10px -5px rgba(0,0,0,0.4); padding: 5px;'><span style='white-space:nowrap;'><center><i class='fa fa-info-circle fa-fw fa-2x' style='text-shadow: 3px 3px 3px #ccc;' onClick='openInfo("+JSON.stringify(planPois[key].poi.url)+");'></i><i class='fa fa-camera fa-fw fa-2x' style='text-shadow: 3px 3px 3px #ccc;' onClick='photoActions("+JSON.stringify(planPois[key].poi.oid)+");'></i><i class='fa fa-commenting-o fa-fw fa-2x' style='text-shadow: 3px 3px 3px #ccc;' onClick='commentActions("+JSON.stringify(planPois[key].poi.oid)+")';></i><i class='fa fa-star fa-fw fa-2x' style='text-shadow: 3px 3px 3px #ccc;' onClick='ratingActions("+JSON.stringify(planPois[key].poi.oid)+");'></i><i class='fa fa-map-signs fa-fw fa-2x' style='text-shadow: 3px 3px 3px #ccc;' onClick=''></i></center></span></div>";
                
                var myIcon = L.divIcon({
                        iconSize: new L.Point(20, 20), 
                        iconAnchor: new L.Point(10,65), 
                        html: '<div style="background-color: rgb(0, 150, 136); color: white;"><center><b>'+counter+'</b></center></div>'
                    });
                counter = counter+1;
                var mm = L.marker([planPois[key].poi.latitude, planPois[key].poi.longitude],{icon:myIcon});
                poisArray.push(mm);
                
                var markerAtr = L.AwesomeMarkers.icon({
                    icon: 'eye',
                    markerColor: color
                });
                
                var m = L.marker([planPois[key].poi.latitude, planPois[key].poi.longitude], {icon: markerAtr, draggable:false}).bindPopup(popupText, {maxWidth:200});
                poisArray.push(m);
            }
            
            planLayer = L.layerGroup(poisArray);
            planLayer.addTo(map);
            
            
            showAlertBootbox("Tap on the <i class='fa fa-hand-o-down'></i> icon at the top-left of the panel to track your position on map.","Info");
            
            
            instructionsMode = true;
            
            if(departureMarker) {
                map.removeLayer(departureMarker);
            }
                    
            L.AwesomeMarkers.Icon.prototype.options.prefix = 'fa';
            
            var markerAtr = L.AwesomeMarkers.icon({
                icon: 'font',
                markerColor: 'green'
            });
            
            departureMarker = L.marker([locationObject.userLatitude,locationObject.userLongitude], {icon: markerAtr}).addTo(map);
            
            var totalDist = routes[0].summary.totalDistance;
            var totalTime = routes[0].summary.totalTime;
            // var wp = routes[0].coordinates;
            // var instructions = routes[0].instructions;
            
            document.getElementById("cancelPlan").style.display = "inline";
            document.getElementById("routeInfo").style.display = "inline";
            document.getElementById("routeInstr").style.display = "inline";
            
            totalDist = (totalDist).toFixed(1) + "km";
            
            if(totalTime < 3600){
                totalTime = parseInt(totalTime/60, 10) + "min";
            } else {
                totalTime = parseInt(totalTime/3600, 10) + "h " + parseInt((totalTime%3600)/60, 10) + "m";
            }
            
            poisIndex = 0;

            document.getElementById("routeDist").innerHTML = totalDist;
            document.getElementById("routeDur").innerHTML = totalTime;
            document.getElementById("instruction").innerHTML = "Next stop: "+planPois[poisIndex].poi.name;
            
        }
    });
}

function cancelPlan() {
    document.getElementById("cancelPlan").style.display = "none";
    document.getElementById("routeInfo").style.display = "none";
    document.getElementById("routeInstr").style.display = "none";
    
    instructionsMode = false;
    
    if(map.hasLayer(planLayer)){
        map.removeLayer(planLayer);
    }
     
    if(control){
        control.removeFrom(map);
        control=null;
    }
    
    if(departureMarker) {
        map.removeLayer(departureMarker);
    }
    
    showLandmarks = true;
    showMuseums = true;
    showMonuments = true;
    showReligiousSites = true;
    showRestaurants = true;
    
    drawPois();
    
}

function openInfo(url) {
    console.log(url)
    if(url != ""){
        var text = 
        '<iframe src="'+url+'" width="100%" height="300" name="SELFHTML_in_a_box">'+
          '<p>Sorry, but your browser cant display iframes <a href="'+url+'">SELFHTML</a></p>'+
        '</iframe>';
        
        if(!freeze){
            freeze=true;
        
            bootbox.dialog({
                closeButton: false,
                title: "<center><b>Info</b></center>",
                message: text,
                
                className: modalClass,
                buttons: {
                    cancel: {
                        label: "Close",
                        className: "btn-default",
                        callback: function () {
                            bootbox.hideAll();
                            freeze=false;
                        }
                    }
                }
            });
        }
    }else{
        showAlertBootbox("No information available for this place.","Info");
    }
    
}

function getUserTrustLevel() {
    var token=window.localStorage.getItem("token");
    var email=window.localStorage.getItem("email");      
    var url='http://'+server+'/getCredits';
    var JSONdata='{"access_token":"'+token+'","userId":"'+email+'"}';
    
    if(!freeze){
        freeze = true;
        bootbox.dialog({
            closeButton: false,
            size: 'small',
            message: "<center><img src='img/loading4.gif' class='img-responsive' alt='loading...'/></center><br><center>Checking Trust Rate..</center>",
            className: modalClass+" heightSmall",
            buttons: {}
        });
        
        var ajaxWorker_getCredits=new Worker("js/ajax.js");
        ajaxWorker_getCredits.postMessage([url,JSONdata]);
        
        ajaxWorker_getCredits.onmessage= function(e){
            
            bootbox.hideAll();
            freeze = false;
                    
            var t=JSON.parse(e.data);
            if(t){
                      
                var trustLevel = "";
                
                if(t.data){
                    trustLevel=t.data[0].TrustLevel;
                                    
                    if(trustLevel >= 0.6){
                        newPoiPrompt();
                    }else{
                        showAlertBootbox("You need to increase your trust level above 60% in order to be eligible to create a new POI. Do that by sending or evaluating reports.","Warning");
                    }
                }
                
            }else{
                showAlertBootbox("Error connecting to the server","Error");
            }                
    
            ajaxWorker_getCredits.terminate();
        }
    }     
}
 

function loadPoisFromDb() {
    
    var x = locationObject.userLatitude;
    var y = locationObject.userLongitude;
    //var range = window.localStorage.getItem("range");//in meters 

    var url_loadPois = 'http://'+poiServer+'/poi/getByLoc?latitude='+x+'&longitude='+y+'&max_distance='+range;
    //console.log(url_loadPois)
    $.ajax({
        url: url_loadPois,
        success: function(data, textStatus, xhr){
            //console.log(JSON.stringify(data))
            
            if(xhr.status == 200){
                if(data){
                    pois = data;
                                        
                    drawPois();
                }else{
                    showAlertBootbox("There was an error while trying to load the POIs","Error");
                }
            }else{
                showAlertBootbox("There was an error while trying to load the POIs","Error");
            }
        },
        error: function(data){  
            //console.log(JSON.stringify(data))
            
            showAlertBootbox("There was an error while trying to load the POIs","Error");
        },
        timeout: 4000
    });
}

function uploadPoiToDb(new_poi) {
    
    var token=window.localStorage.getItem("token");
    var email=window.localStorage.getItem("email");
    
    var JSONdata = JSON.stringify({
                        "userId":new_poi.userId,
                        "latitude":new_poi.latitude,
                        "longitude":new_poi.longitude,
                        "name": new_poi.name,
                        "tags": new_poi.tags,
                		"url": new_poi.url,
                        "auth_token": token,
                        "auth_userid": email
                    });
                        
    console.log(JSONdata)
    var url_uploadPoi= 'http://'+poiServer+'/poi';
    
    freeze = true;
    bootbox.dialog({
        closeButton: false,
        size: 'small',
        message: "<center><img src='img/loading4.gif' class='img-responsive' alt='loading...'/></center><br><center>Uploading POI..</center>",
        className: modalClass+" heightSmall",
        buttons: {}
    });

    $.ajax({
        type: "POST",
        contentType: "application/json; charset=utf-8",
        url: url_uploadPoi,
        data: JSONdata,
        success: function(data, textStatus, xhr){
            //console.log(data)
            
            if(xhr.status == 200){
                bootbox.hideAll();
                freeze = false;
                
                showAlertBootbox("New POI added!","Success");
            }else{
                bootbox.hideAll();
                freeze = false;
                
                showAlertBootbox("A network error occurred when trying to upload the POI. Please try again.","Error");
            }
            
        },
        error: function(data){       
            //console.log(data)
            
            bootbox.hideAll();
            freeze = false;
            
            showAlertBootbox("A network error occurred when trying to upload the POI. Please try again.","Error");
        },
        timeout: 4000
    });
}

function loadPhotosFromDb() {
    
    var oid = selectedPoi;
    
    var url_loadPhotos = 'http://'+poiServer+'/photo?oid=' + oid;
    
    freeze = true;
    bootbox.dialog({
        closeButton: false,
        size: 'small',
        message: "<center><img src='img/loading4.gif' class='img-responsive' alt='loading...'/></center><br><center>Loading Gallery..</center>",
        className: modalClass+" heightSmall",
        buttons: {}
    });
            
    $.ajax({
        url: url_loadPhotos,
        success: function(data, textStatus, xhr){
            //console.log(JSON.stringify(data));

            if(xhr.status == 200){
                if(data){
                    galleries = data;
                    
                    bootbox.hideAll();
                    freeze = false;
                                    
                    showGallery();
                }else{
                    bootbox.hideAll();
                    freeze = false;
                    
                    showAlertBootbox("There was an error while trying to load the gallery","Error");
                }
            }else{
                bootbox.hideAll();
                freeze = false;
                    
                showAlertBootbox("There was an error while trying to load the gallery","Error");
            }
        },
        error: function(){  
            bootbox.hideAll();
            freeze = false;
            
            showAlertBootbox("There was an error while trying to load the gallery","Error");
        },
        timeout: 40000
    });
    
}

function uploadPhotoToDb(userName,imageBase64) {
    
    var token=window.localStorage.getItem("token");
    var email=window.localStorage.getItem("email");
    
    var JSONdata = JSON.stringify({
                        "oid":selectedPoi,
                        "src":imageBase64,
                        "userId":userName,
                        "auth_token": token,
                        "auth_userid": email
                    });
    
    var url_uploadPhoto = 'http://'+poiServer+'/photo';
    
    freeze = true;
    bootbox.dialog({
        closeButton: false,
        size: 'small',
        message: "<center><img src='img/loading4.gif' class='img-responsive' alt='loading...'/></center><br><center>Uploading Photo..</center>",
        className: modalClass+" heightSmall",
        buttons: {}
    });

    $.ajax({
        type: "POST",
        contentType: "application/json; charset=utf-8",
        url: url_uploadPhoto,
        data: JSONdata,
        success: function(data, textStatus, xhr){
            //console.log(data);

            if(xhr.status == 200){
                
                bootbox.hideAll();
                freeze = false;
                
                showAlertBootbox("Photo uploaded successfully.","Success");
            }else{
                
                bootbox.hideAll();
                freeze = false;
                    
                showAlertBootbox("A network error occurred when trying to upload the photo. Please try again.","Error");
            }
        },
        error: function(data){       
            //console.log(data)
            
            bootbox.hideAll();
            freeze = false;
            
            showAlertBootbox("A network error occurred when trying to upload the photo. Please try again.","Error");
        },
        timeout: 40000
    });
}

function loadCommentsFromDb() {
    
    var oid = selectedPoi;
    
    var url_loadComments = 'http://'+poiServer+'/comment?oid=' + oid;
    
    freeze = true;
    bootbox.dialog({
        closeButton: false,
        size: 'small',
        message: "<center><img src='img/loading4.gif' class='img-responsive' alt='loading...'/></center><br><center>Loading Comments..</center>",
        className: modalClass+" heightSmall",
        buttons: {}
    });
            
    $.ajax({
        url: url_loadComments,
        success: function(data, textStatus, xhr){
            //console.log(JSON.stringify(data));
            
            if(xhr.status == 200){
                if(data){
                    comments = data;
                    
                    bootbox.hideAll();
                    freeze = false;
                                    
                    showComments();
                }else{
                
                    bootbox.hideAll();
                    freeze = false;
                        
                    showAlertBootbox("There was an error while trying to load the comments","Error");
                }
            }else{
                
                bootbox.hideAll();
                freeze = false;
                    
                showAlertBootbox("There was an error while trying to load the comments","Error");
            }
        },
        error: function(){  
            
            bootbox.hideAll();
            freeze = false;
            
            showAlertBootbox("There was an error while trying to load the comments","Error");
        },
        timeout: 4000
    });
}

function uploadCommentToDb(userName,comment) {
    
    var token=window.localStorage.getItem("token");
    var email=window.localStorage.getItem("email");
    var d = new Date();
    
    var JSONdata = JSON.stringify({
                        "oid":selectedPoi,
                        "userId":userName,
                        "time":d.toDateString(),
                        "text":comment,
                        "auth_token": token,
                        "auth_userid": email
                    });
    
    var url_uploadComment = 'http://'+poiServer+'/comment';
    
    freeze = true;
    bootbox.dialog({
        closeButton: false,
        size: 'small',
        message: "<center><img src='img/loading4.gif' class='img-responsive' alt='loading...'/></center><br><center>Sending Comment..</center>",
        className: modalClass+" heightSmall",
        buttons: {}
    });

    $.ajax({
        type: "POST",
        contentType: "application/json; charset=utf-8",
        url: url_uploadComment,
        data: JSONdata,
        success: function(data, textStatus, xhr){
            //console.log(data)
            
            if(xhr.status == 200){
                
                bootbox.hideAll();
                freeze = false;
                
                showAlertBootbox("Comment posted successfully.","Success");
            }else{
                
                bootbox.hideAll();
                freeze = false;
                    
                showAlertBootbox("A network error occurred when trying to post the comment. Please try again.","Error");
            }
        },
        error: function(data){       
            //console.log(data)
            
            bootbox.hideAll();
            freeze = false;
            
            showAlertBootbox("A network error occurred when trying to post the comment. Please try again.","Error");
        },
        timeout: 4000
    });
}

function uploadRatingToDb(userName,rating) {
    
    var token=window.localStorage.getItem("token");
    var email=window.localStorage.getItem("email");
    
    var JSONdata = JSON.stringify({
                        "oid":selectedPoi,
                        "userId":userName,
                        "rating":rating,
                        "auth_token": token,
                        "auth_userid": email
                    });
    
    var url_uploadRating = 'http://'+poiServer+'/rating';
    
    freeze = true;
    bootbox.dialog({
        closeButton: false,
        size: 'small',
        message: "<center><img src='img/loading4.gif' class='img-responsive' alt='loading...'/></center><br><center>Sending Rating..</center>",
        className: modalClass+" heightSmall",
        buttons: {}
    });

    $.ajax({
        type: "POST",
        contentType: "application/json; charset=utf-8",
        url: url_uploadRating,
        data: JSONdata,
        success: function(data, textStatus, xhr){
            //console.log(data)
            
            if(xhr.status == 200){
                
                bootbox.hideAll();
                freeze = false;
                
                loadPoisFromDb();
                
                showAlertBootbox("Rate Submited!","Success");
            }else{
                
                bootbox.hideAll();
                freeze = false;
                    
                showAlertBootbox("A network error occurred when trying to submit the rating. Please try again.","Error");
            }
        },
        error: function(data){       
            //console.log(JSON.stringify(data))
            
            bootbox.hideAll();
            freeze = false;
            
            showAlertBootbox("A network error occurred when trying to submit the rating. Please try again.","Error");
        },
        timeout: 4000
    });
}

