Callsignviz
===========

JAX-RS endpoint for receiving spot data from remote clients running CallsignSpotParserApp.

Spots collected by the endpoint are sent to a JMS queue to be picked up for server-side
processing and storage. Data stored is used by the Spot Vizualizer webapp to display
spots on a map.