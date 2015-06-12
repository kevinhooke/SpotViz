package kh.callsign.spotcollector.service;

import java.util.Date;

import javax.inject.Inject;
import javax.inject.Named;

import kh.callsign.spotcollector.data.CallsignProcessorDao;
import kh.hamqthclient.HamQTHClient;
import kh.hamqthclient.xml.HamQTHSearch;
import kh.hamqthclient.xml.Search;
import kh.radio.spotparser.domain.Spot;
import kh.radio.spotparser.domain.SpotDetail;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

@Named
public class CallsignProcessorService {

	private static Logger LOGGER = LogManager
			.getLogger("kh.callsign.spotcollector.endpoint");
	
	@Inject
	//CallsignProcessorMongoDBDaoImpl from Maven dependency on CallsignSpotDataMongoDB
	private CallsignProcessorDao dao;
	
	private HamQTHClient hamQTHClient;
	
	public CallsignProcessorService(){
		this.hamQTHClient = new HamQTHClient();
		
		//TODO: logon session last for 1 hour. If we call the api and get an error
		//we need to re-logon. Need to add/test this behavior.
		this.hamQTHClient.logon();
	}
	
	/**
	 * 
	 * @param spot
	 */
	public boolean process(Spot spot){
		boolean successfullyProcessed = false;
		
		//has this entry already been submitted, if so do nothing		
		if(!this.dao.existsSpotBySpotterAndTimestamp(spot)){
			
			LOGGER.debug("... new spot: processing");
			
			//CQ MYCALL GRID
			//HISCALL MYCALL GRID
			//HISCALL MYCALL REPORT (*2 either way)
			//HISCALL MYCALL RRR
			//HISCALL MYCALL 73
			
			HamQTHSearch searchResult = this.hamQTHClient.lookupCallsign(spot.getWord2());
			Search search = searchResult.getSearch();

			SpotDetail detail = new SpotDetail();
			detail.setDateLastProcessed(new Date());

			if(search != null){
				//update spot with geo info
				
				//TODO: need to check for an error message here
				if(search.getLatitude() != null){
					detail.setErrorMessage("success");
					detail.setLatitude(search.getLatitude());
					detail.setLongitude(search.getLongitude());
				}
				else{
					detail.setStatus("error");
					detail.setErrorMessage("No lat/long info returned from HamQTH");
				}
			}
			else{
				detail.setStatus("error");
				detail.setErrorMessage("No response frm HamQTH, or failed lookup (unknown callsign?)");
			}
			
			spot.setSpotDetail(detail);
			//store the new spot data
			this.dao.create(spot);
		}
		else{
			LOGGER.debug("... duplicate spot: ignoring");
		}
		
		
		return successfullyProcessed;
	}
}
