package kh.callsign.spotcollector.endpoint;

import java.util.List;

import javax.jws.WebMethod;
import javax.jws.WebService;

import kh.radio.spotparser.domain.Spot;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

@WebService
public class SpotCollectorEndpoint {

	private static Logger LOG = LogManager.getLogger("kh.callsign.spotcollector.endpoint");
	
	@WebMethod
	public void storeSpots(List<Spot> spots){
		
		LOG.info("Endpoint received " + spots.size() + " spots");
		
	}
	
}
