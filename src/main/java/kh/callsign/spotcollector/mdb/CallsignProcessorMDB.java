package kh.callsign.spotcollector.mdb;

import javax.ejb.ActivationConfigProperty;
import javax.ejb.MessageDriven;
import javax.inject.Inject;
import javax.jms.JMSException;
import javax.jms.Message;
import javax.jms.MessageListener;

import kh.callsign.spotcollector.service.CallsignProcessorService;
import kh.radio.spotparser.domain.Spot;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

@MessageDriven(mappedName = "queue/spot", activationConfig = {
		@ActivationConfigProperty(propertyName = "acknowledgeMode", propertyValue = "Auto-acknowledge"),
		@ActivationConfigProperty(propertyName = "destinationType", propertyValue = "javax.jms.Queue"),
		@ActivationConfigProperty(propertyName = "destination", propertyValue = "jms/queue/spot") })
public class CallsignProcessorMDB implements MessageListener{

	private static final Logger LOG = LogManager.getLogger("kh.callsign.spotcollector.mdb");
	
	@Inject
	private CallsignProcessorService service;
	
	@Override
	public void onMessage(Message msg) {

		LOG.info("Message received on queue!");
		
		//pick up message and store to db
		try {
			Spot spot = msg.getBody(Spot.class);
			LOG.info("... spot received for time: " + spot.getTime());
			this.service.process(spot);
			LOG.info("... spot processed");
			
		} catch (JMSException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
	}

}
