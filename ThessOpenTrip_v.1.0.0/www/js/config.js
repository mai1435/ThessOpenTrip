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

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
// This is a JavaScript file which holds the configuration settings
//var server="160.40.51.46/slim/API/v1";

var server="109.231.126.241/slim/API/v1";


var version="1.0.0";

var debug=false;//true;//false;
var userId="";
var userPassword="";
var userPhone=0;
var locationObject={};
var locations=[];
var reportObject={};
var token="";
var loadTraffic=true;
var freeze=false; // used to freeze the menu and report buttons when bootbox dialog is open
var loadReportsTime=30; //in minutes
var loadReportsTimeLimit=1440; //24hours
var nearDistance=50; //in km
var nearDistanceLimit=200; //in km
var nearDistanceOfNots=1;  //in km
var nearDistanceOfNotsLimit=20; //km
//var walkRadius=1;   //in km
var showNotificationForIncomingReport="true"; //default value for showing notifications for incoming new reports
var showSelfReports="true"; //default value for showing notifications for self reports
var soundForIncomingReport="true"; //default value for playing sound for incoming reports
var vibrationForIncomingReport="true"; //default value for vibration for incoming reports
var reportEvaluationPeriod=300000; //5 minutes The time that a report is judged by majority voting by others
var passwordSizeMax=12;
var passwordSizeMin=6;
var angleThreshold=35; //This is the angle where user's heading and report bearing should be taken as approach
var reliability=0;
var severityRate="";

var carRefreshMap = 500;
var transRefreshMap = 2000;
var cycleRefreshMap = 2500;
var walkRefreshMap = 4000;

var mode="walk";//"drive";//walk//transportation//cycling
var backround="black"; //white

//If user has modified some they are stored in localstorage, so:


if (localStorage.getItem("mode") !== null) {
    mode=localStorage.getItem("mode");
}

if (localStorage.getItem("backround") !== null) {
    backround=localStorage.getItem("backround");
}

if (localStorage.getItem("nearDistance") !== null) {
    nearDistance=localStorage.getItem("nearDistance");
}

if (localStorage.getItem("nearDistanceOfNots") !== null) {
    nearDistanceOfNots=localStorage.getItem("nearDistanceOfNots");
}

if (localStorage.getItem("loadReportsTime") !== null) {
    loadReportsTime=localStorage.getItem("loadReportsTime");
}

if (localStorage.getItem("showNotificationForIncomingReport") !== null) {
    showNotificationForIncomingReport=localStorage.getItem("showNotificationForIncomingReport");
}

if (localStorage.getItem("showSelfReports") !== null) {
    showSelfReports=localStorage.getItem("showSelfReports");
}

//if (localStorage.getItem("server") !== null) {
//    server=localStorage.getItem("server");
//}

if (localStorage.getItem("soundForIncomingReport") !== null) {
    soundForIncomingReport=localStorage.getItem("soundForIncomingReport");
}

if (localStorage.getItem("vibrationForIncomingReport") !== null) {
    vibrationForIncomingReport=localStorage.getItem("vibrationForIncomingReport");
}

//If you change these settings remember to change the correspoding on the function change mode


if(mode==="drive"){
    var refreshMap=carRefreshMap; //in milliseconds - 
    var getLoacation=3000; //in milliseconds
    var getReportsInt=10000; //in milliseconds
}else if(mode==="transportation"){
    var refreshMap=transRefreshMap; //in milliseconds - 
    var getLoacation=3000; //in milliseconds
    var getReportsInt=10000; //in milliseconds
}else if(mode==="cycling"){
    var refreshMap=cycleRefreshMap; //in milliseconds - 
    var getLoacation=3000; //in milliseconds
    var getReportsInt=10000; //in milliseconds
}else{
    var refreshMap=walkRefreshMap; //in milliseconds - 
    var getLoacation=3000; //in milliseconds
    var getReportsInt=10000; //in milliseconds
}

var sendPositions=60000; //in milliseconds
var checkModeAndSpeeds=300000; //5 minutes 
var speeds=[]; //This is used on periodic check of speed and working mode

var intervalRefreshMap="";
var intervalRefreshLocation="";
var intervalGetReports="";
var intervalSendPositions="";
var intervalGetReports="";
var inboxMessageId=[];//This is used for indexing messages for inbox not to duplicate them
var address=null; //used for inbox;
var rows=0;//used for inbox
var informedReports=[];//This is used in order not to inform about the same report twice.

var alertAutocloseNotification=4000; //in milliseconds
var inboxUpperLimit=10; //slows down the system if there are too many in inbox

//The page width of UI windows
var pageWidth = document.body.clientWidth;
var pwidth="";
var modalClass="";
var xs="";
    
    if(pageWidth <= 768){
        pwidth="100%";
        xs=5;
        modalClass="col-md-9";
    }else{
        pwidth= "768px";
        xs=3;
        modalClass="col-xs-offset-2 col-xs-8";
    }
    
    //The push pins array for insert/remove
    var pushPins=[];
    //The modal class

    //The icons
    var fun=null;
    var icon=null;
    if(mode==="drive"){
        fun="reportPrompt()";
        icon="car";
    }else if(mode==="transportation"){
        fun="reportPrompt()";
        icon="bus";
    }else if(mode==="cycling"){
        fun="reportPrompt()";
        icon="bicycle";
    }else{
        //fun="loadPin()";
        fun="reportPrompt()";
        icon="user";
    }

var ajaxWorker=new Worker("js/ajax.js");

var lastMarkerLayer=""; //This is the name of the last marker layer,used for delete each time

var prevHeadings = []; //This array is used for recovering user's heading based on previous headings
var avSpeeds = [];
var maxSpeeds = [];
var headingChanges = [];
var averages = [];

var driveTile = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
var transportTile = 'http://{s}.tile2.opencyclemap.org/transport/{z}/{x}/{y}.png';
var cycleTile = 'http://{s}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png';
var currTileLayer;
var trafficLayer;
var storedAddress=null;
var statusDiv=document.getElementById("statusDiv");

var showAgainLTR = true;
//=====================================================================//
var poiServer = "109.231.126.241/poidb/public";
//var poiServer = "160.40.50.61/poidb/public";

var pois = {};
var poisLayer = null;
var planLayer = null;
var range = 5;
var rating = null;
var control = null;
var departureMarker = null;
var planPois = [];

var showLandmarks = true;
var showMuseums = true;
var showMonuments = true;
var showReligiousSites = true;
var showRestaurants = true;

function poi(oid,userId,latitude,longitude,name,url,tags,ratings){
    this.oid = oid;
    this.userId = userId;
    this.latitude = latitude;
    this.longitude = longitude;
    this.name = name;
    this.tags = tags;
    this.url = url;
    this.ratings = ratings;
}
 
var galleries = [];
var comments = [];
var selectedPoi = null;
var instructionsMode = false;
var userName = null;
var spendTime = null;
var transitionTimeBetweenPlaces = 10; //min

if (localStorage.getItem("range") !== null) {
    range=localStorage.getItem("range");
}