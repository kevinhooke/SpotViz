package kh.callsign.spotcollector.endpoint;

import javax.annotation.Resource;
import javax.enterprise.context.RequestScoped;
import javax.jms.ConnectionFactory;
import javax.jms.JMSContext;
import javax.jms.Queue;
import javax.ws.rs.GET;
import javax.ws.rs.Path;

@RequestScoped
@Path("/spotcollectortest")
public class SpotCollectorTestEndpoint {

	@Resource(lookup = "java:comp/DefaultJMSConnectionFactory")
	private static ConnectionFactory connectionFactory;

	@Resource(lookup = "java:jboss/exported/jms/queue/spot")
	private static Queue queue;

	
	/**
	 * Pushes test message to queue
	 */
	@GET
	public String testPublishToQueue(){
		JMSContext context = connectionFactory.createContext();
		context.createProducer().send(queue, "test!");
		return "<html><body><p>Called!</p></body></html>";
	}
	
}
