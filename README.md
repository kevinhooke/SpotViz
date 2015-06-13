# SpotViz
Historical visualization of amateur radio received signals using JT65/JT9 modes.

This webapp provides an animated representation of received amateur radio signals 
over time, displayed using Google Maps.

I built this app as a learning exercise to try out building a webapp
using AngularJS for a MV* frontend, against JAX-RS resources.

Data is submitted to the server currently via a standalone app that parses
the log files from WSJT-X (see https://github.com/kevinhooke/WSJTLogParser), 
and sends to a JAX-WS endpoint. Received data is dropped to a JMS queue for 
further processing (including location lookup by calling HamQTH, using this
client API: https://github.com/kevinhooke/HamQTHClient) and is eventualy stored
to MongoDB for visualization via the AngularJS front end.

This is very much a work in progress but is hosted on OpenShift here https://www.spotviz.info 
- if you try out the app and have any feedback/enhancement suggestions/bugs, please
log them on my project issue tracker here: https://github.com/kevinhooke/SpotViz/issues


