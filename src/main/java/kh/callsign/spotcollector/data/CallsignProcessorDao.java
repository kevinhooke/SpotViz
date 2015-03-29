package kh.callsign.spotcollector.data;

import kh.radio.spotparser.domain.Spot;

public interface CallsignProcessorDao {

	public void store(Spot spot);
	
	public Spot findSpotBySpotterAndTimestamp(Spot spot);


}
