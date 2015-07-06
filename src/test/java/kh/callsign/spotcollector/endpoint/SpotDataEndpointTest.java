package kh.callsign.spotcollector.endpoint;

import java.time.ZonedDateTime;

import org.junit.Test;

import com.mongodb.DBObject;
import com.mongodb.util.JSON;

public class SpotDataEndpointTest {

	@Test
	public void test() {
		SpotDataEndpoint endpoint = new SpotDataEndpoint();
		ZonedDateTime z = endpoint.parseDateStringToUTC("2014-07-07T01:00:00Z");
	}

	@Test
	public void testGetAggregationQueryGroup(){
		SpotDataEndpoint endpoint = new SpotDataEndpoint();
		DBObject o = endpoint.getAggregationQueryGroup();
		
		String jsonString = JSON.serialize(o);
		System.out.println(jsonString);
	}
	
}
