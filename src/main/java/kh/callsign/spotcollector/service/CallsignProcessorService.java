package kh.callsign.spotcollector.service;

import javax.inject.Inject;
import javax.inject.Named;

import kh.callsign.spotcollector.data.CallsignProcessorDao;
import kh.radio.spotparser.domain.Spot;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

@Named
public class CallsignProcessorService {

	private static Logger LOGGER = LogManager
			.getLogger("kh.callsign.spotcollector.endpoint");
	
	@Inject
	private CallsignProcessorDao dao;
	
	/**
	 * 
	 * @param spot
	 */
	public boolean process(Spot spot){
		boolean successfullyProcessed = false;
		
		//has this entry already been submitted, if so do nothing
		Spot alreadyStored = this.dao.findSpotBySpotterAndTimestamp(spot);
		if(alreadyStored == null){
			
			LOGGER.debug("... new spot: processing");
			
			//if new, store
			this.dao.store(spot);
			
			//lookup location via HamQTH
			
			//store location updates

			
		}
		else{
			LOGGER.debug("... duplicate spot: ignoring");
		}
		
		
		return successfullyProcessed;
	}
}
