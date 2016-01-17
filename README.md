# ThessOpenTrip
ThessOpenTrip is a mobile application developed with Apache Cordova (HTML, CSS & JS). It is designed for tourists who visit Thessaloniki, aiming at facilitating their stay and sightseeing in various ways. The application deploys crowd-sourcing techniques for generating data by the end users and contributes to the open data community by allowing anonymous access to the user-generated data, provided through an open Application Programming Interface (API).

ThessOpenTrip allows the crowd to create, evaluate and interact with points of interest (POIs) as well as to submit reports about various incidents, which take place in real time in the city of Thessaloniki and displayed on the city map (ThessOpenTrip incorporates OpenStreetMaps map system). In particular, the incidents that are supported are related to street events (e.g. festivals) and or current urban mobility conditions (e.g. live traffic). In this way, i.e. through the exploitation of crowd sourcing techniques, the application builds an open data repository of POIs and incidents that are of high interest to the city visitors, but also to data analysts, journalists, etc.

One of the key innovations of ThessOpenTrip relies on a mechanism for evaluating the reliability of the submitted reports, based on the reputation of the user, their location with respect to the event they report and their current speed. The real users also participate in this evaluation process in a crowd sourcing fashion, as follows. All users who are moving close to the reported incident are asked to validate the submitted report in real time. User feedback is used by a probabilistic model in order to estimate the degree of reliability of the submitted report. This mechanism contributes to the validation of the data that the crowd submits, providing a data filtering facility, as opposed to the most common applications of this kind, which allow any data, even span information to be shared among the users of the same network. The ThessOpenTrip reliability estimation mechanism assures that no malicious information is injected into the system. E.g. only users with a high trust level (above 60%) can add new POIs.

On top of that, ThessOpenTrip enables users to create and perform cultural tours through the city’s numerous monuments, landmarks, museums, restaurants or religious sites, based on the user’s preferences with respect to available time, starting location, number of nearby places, and types of POIs, thus providing an integrated touristic information service that supports real time information.

# Installation
Follow the link below to get the .apk of the application:
https://www.dropbox.com/sh/28vs51id9dl3iif/AACjs_y_Iq26SKMKbcb80hsaa?dl=0

# Licence
GNU Lesser General Public License 3.0: https://www.gnu.org/copyleft/lesser.html
