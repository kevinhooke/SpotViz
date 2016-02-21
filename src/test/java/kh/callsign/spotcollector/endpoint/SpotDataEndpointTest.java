package kh.callsign.spotcollector.endpoint;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import java.time.ZonedDateTime;

import javax.ws.rs.client.Client;
import javax.ws.rs.client.ClientBuilder;
import javax.ws.rs.client.WebTarget;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.junit.Test;

import com.mongodb.DBObject;
import com.mongodb.util.JSON;

public class SpotDataEndpointTest {

	private static final String EXPECTED_AGGREGATION_QUERY = "{ \"$group\" : { \"_id\" : { \"$subtract\" : [ { \"$subtract\" : [ \"$spotReceivedTimestamp\" , { \"$date\" : \"1970-01-01T00:00:00.000Z\"}]} , { \"$mod\" : [ { \"$subtract\" : [ \"$spotReceivedTimestamp\" , { \"$date\" : \"1970-01-01T00:00:00.000Z\"}]} , 86400000]}]} , \"count\" : { \"$sum\" : 1}}}";
	
	private WebTarget getClient() {
		Client client = ClientBuilder.newClient();
		return client.target("http://localhost:8080/spotviz/spotdata");
	}
	
	@Test
	public void testParseDateStringToUTC() {
		SpotDataEndpoint endpoint = new SpotDataEndpoint();
		ZonedDateTime z = endpoint.parseDateStringToUTC("2014-07-07T01:00:00Z");
		assertNotNull(z);
		assertTrue(z.getZone().getId().equals("Z"));
	}

	@Test
	public void testGetAggregationQueryGroup(){
		SpotDataEndpoint endpoint = new SpotDataEndpoint();
		DBObject o = endpoint.getAggregationQueryGroup();
		
		String jsonString = JSON.serialize(o);
		assertEquals(EXPECTED_AGGREGATION_QUERY, jsonString);
	}
	
	/**
	 * Call to live endpoint.
	 */
	@Test
	public void testGetAllSpots(){
		
		Response result = this.getClient()
				.path("/spots")
				.request(MediaType.APPLICATION_JSON_TYPE)
				.get();
		assertTrue(result.getStatus() == 200);
		//System.out.println(result);
	}
	


	@Test
	public void testGetTopLargestUploads(){
		String result = this.getClient()
				.path("/topUploads")
				.request(MediaType.APPLICATION_JSON_TYPE)
				.get(String.class);
		//assertTrue(result.getStatus() == 200);
		System.out.println(result);
	}
}
