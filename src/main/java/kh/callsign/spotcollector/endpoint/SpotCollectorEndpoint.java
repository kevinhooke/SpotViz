package kh.callsign.spotcollector.endpoint;

import java.util.List;

import javax.annotation.Resource;
import javax.inject.Inject;
import javax.jms.ConnectionFactory;
import javax.jms.JMSContext;
import javax.jms.JMSException;
import javax.jms.JMSProducer;
import javax.jms.ObjectMessage;
import javax.jms.Queue;
import javax.jws.WebMethod;
import javax.jws.WebService;

import kh.radio.spotparser.domain.Spot;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

@WebService
public class SpotCollectorEndpoint {

	private static Logger LOG = LogManager
			.getLogger("kh.callsign.spotcollector.endpoint");

	@Resource(lookup = "java:comp/DefaultJMSConnectionFactory")
	private ConnectionFactory connectionFactory;
	
	//TODO: take a look at : http://middlewaresnippets.blogspot.com/2014/07/wildflying-java-ee-7.html
	//@Inject
	//@JMSConnectionFactory("java:comp/DefaultJMSConnectionFactory")
	@Inject
	private JMSContext context;
	
	//@Resource(lookup = "java:jboss/exported/jms/queue/spot")
	@Resource(lookup = "java:/jms/queue/spot")
	private Queue queue;

	@WebMethod
	public void storeSpots(List<Spot> spots) throws JMSException {
		if (spots == null) {
			LOG.error("Endpoint called with no spot data?");
		} else {
			LOG.info("Endpoint received " + spots.size() + " spots");

			//prior to JMS 2.0
			//Connection connection = connectionFactory.createConnection();
            //Session session = connection.createSession(true, 0);
            //MessageProducer producer = session.createProducer(queue);
			
			//try (JMSContext context = connectionFactory.createContext();) {
			
			
			JMSProducer producer = context.createProducer();
				
			
			
				//send each received spot to queue for processing and storing
				for(Spot spot : spots){
					ObjectMessage msg = context.createObjectMessage();
					msg.setObject(spot);
					producer.send(queue, msg);
					
					
				//}
			//} catch (Exception e) {
				//LOG.error("Failed to create JMS Context", e);
				
				
			}
		}
	}

}
