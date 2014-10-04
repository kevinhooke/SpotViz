package kh.callsign.spotcollector.mdb;

import javax.ejb.ActivationConfigProperty;
import javax.ejb.MessageDriven;
import javax.jms.Message;
import javax.jms.MessageListener;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

@MessageDriven(mappedName = "queue/spot", activationConfig = {
		@ActivationConfigProperty(propertyName = "acknowledgeMode", propertyValue = "Auto-acknowledge"),
		@ActivationConfigProperty(propertyName = "destinationType", propertyValue = "javax.jms.Queue"),
		@ActivationConfigProperty(propertyName = "destination", propertyValue = "jms/queue/spot") })
public class CallsignProcessorMDB implements MessageListener{

	private static final Logger LOG = LogManager.getLogger("kh.callsign.spotcollector.mdb");
	
	@Override
	public void onMessage(Message msg) {

		LOG.info("Message received on queue!");
		
		
	}

}
