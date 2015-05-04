package kh.callsign.spotcollector.endpoint;

import java.time.ZonedDateTime;

import org.junit.Test;

public class SpotDataEndpointTest {

	@Test
	public void test() {
		SpotDataEndpoint e = new SpotDataEndpoint();
		ZonedDateTime z = e.parseDateStringToUTC("2014-07-07T01:00:00Z");
	}

}
