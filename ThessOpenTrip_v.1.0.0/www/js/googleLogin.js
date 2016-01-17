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

var googleapi = {
    authorize: function(options) {
        var deferred = $.Deferred();

        //Build the OAuth consent page URL
        var authUrl = 'https://accounts.google.com/o/oauth2/auth?' + $.param({
            client_id: options.client_id,
            redirect_uri: options.redirect_uri,
            response_type: 'code',
            scope: options.scope
        });

        //Open the OAuth consent page in the InAppBrowser
        var authWindow = window.open(authUrl, '_blank', 'location=no,toolbar=no,clearcache=yes,clearsessioncache=yes');

        //The recommendation is to use the redirect_uri "urn:ietf:wg:oauth:2.0:oob"
        //which sets the authorization code in the browser's title. However, we can't
        //access the title of the InAppBrowser.
        //
        //Instead, we pass a bogus redirect_uri of "http://localhost", which means the
        //authorization code will get set in the url. We can access the url in the
        //loadstart and loadstop events. So if we bind the loadstart event, we can
        //find the authorization code and close the InAppBrowser after the user
        //has granted us access to their data.
        $(authWindow).on('loadstart', function(e) {
            var url = e.originalEvent.url;
            var code = /\?code=(.+)$/.exec(url);
            var error = /\?error=(.+)$/.exec(url);

            if (code || error) {
                //Always close the browser when match is found
                authWindow.close();
            }

            if (code) {
                //Exchange the authorization code for an access token
                $.post('https://accounts.google.com/o/oauth2/token', {
                    code: code[1],
                    client_id: options.client_id,
                    client_secret: options.client_secret,
                    redirect_uri: options.redirect_uri,
                    grant_type: 'authorization_code'
                }).done(function(data) {
                    deferred.resolve(data);
                }).fail(function(response) {
                    deferred.reject(response.responseJSON);
                });
            } else if (error) {
                //The user denied access to the app
                deferred.reject({
                    error: error[1]
                });
            }
        });

        return deferred.promise();
    }
};

var googleToken;

function googleLogin() {
    var $loginButton = $('#login a');
    var $loginStatus = $('#login p');

    $loginButton.on('click', function() {
        googleapi.authorize({
            client_id: '1081618989384-pqpqt6lum7dngdmvl40hn3r8i39h2im9.apps.googleusercontent.com',
            client_secret: 'HhJawWau5LQyLS3VqXGEtVhG',
            redirect_uri: 'http://localhost',
            scope: 'https://www.googleapis.com/auth/userinfo.email'//https://www.googleapis.com/auth/analytics.readonly'
        }).done(function(data) {            
            //console.log(JSON.stringify(data));
            //$loginStatus.html('Access Token: ' + data.access_token);
            googleToken=data.access_token;
            getGoogleEmail(googleToken);
        }).fail(function(data) {
            $loginStatus.html(data.error);
        });
    });
}

function getGoogleEmail(googleToken){
    var email;
    var url="https://www.googleapis.com/plus/v1/people/me?fields=emails&access_token="+googleToken;
    $.ajax({
        url: url,
        type:'GET',
        success: function(data) {                 
            if(data.emails){
            //The user is authenticated
            email=data.emails[0].value;            
            insertGoogleUser(email);                        
            }
        }
    });    
}

function insertGoogleUser(email){
     $.ajax({
            url: 'http://'+server+'/insertGoogleUser',
            type: "POST",
            contentType: "application/json",
            data: '{ "email":"'+email+'"}',
            error: function(data){
                console.log(JSON.stringify(data));
                },
            success:function(data){                
                    $.ajax({        
		            type: "POST",		
		            url: 'http://'+server+'/generateKS',		
                    data: '{"username":"'+email+'","password":"movesmart"}', //The default password for google users
            		contentType: "application/json",
                    error: function(data){		
                    console.log(JSON.stringify(data));
		            },
		            success: function(data){
                        
                        if(email.indexOf("@") > -1){
                            userName = email.substring(0,email.indexOf("@"));
                        }else{
                            userName = email;
                        }
                        window.localStorage.setItem("userName", userName);
                        obj=JSON.parse(data);
                        key=obj.key;
                        secret=obj.secret;
                        var reportsJudged=new Array("1","2");
                        reportsJudged=JSON.stringify(reportsJudged);
                         window.localStorage.setItem("email", Sha1.hash(email));
                         window.localStorage.setItem("keyS", key);
                         window.localStorage.setItem("secret", secret);
                         window.localStorage.setItem("reportsJudged", reportsJudged);
                         //load the main page
                         var divL=document.getElementById('unauthenticated');
                         divL.className="hide";
                         document.getElementById('mainPage').className="";
                         
                        
                        location.reload(); 
                        }
		            });
                }
    });                            
}
