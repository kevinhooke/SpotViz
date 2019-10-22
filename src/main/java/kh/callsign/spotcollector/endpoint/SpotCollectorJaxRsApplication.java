package kh.callsign.spotcollector.endpoint;

import javax.ws.rs.ApplicationPath;
import javax.ws.rs.core.Application;

@ApplicationPath("/spotviz")
public class SpotCollectorJaxRsApplication extends Application {
	String donothing;
}
