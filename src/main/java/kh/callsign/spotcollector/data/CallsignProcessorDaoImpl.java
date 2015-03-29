package kh.callsign.spotcollector.data;

import javax.inject.Named;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

import kh.radio.spotparser.domain.Spot;

import org.hibernate.ogm.OgmSession;

@Named
public class CallsignProcessorDaoImpl implements CallsignProcessorDao {

	@PersistenceContext
	private EntityManager em;
	
	
	public void store(Spot spot){
		this.em.persist(spot);
	}
	
	/**
	 * Retrieves a spot by spotter and timestamp. Used to check if a submitted spot
	 * already exists.
	 * @param spot
	 */
	@Override
	public Spot findSpotBySpotterAndTimestamp(Spot spot){
		
		//TODO: this check should be by date AND time
		
		StringBuilder builder = new StringBuilder();
		builder.append("{ $and: [ { spotter : '");
		builder.append(spot.getSpotter());
		builder.append("'}, { time : '");
		builder.append(spot.getTime());
		builder.append("'} ] }");
		
		OgmSession session = this.em.unwrap(OgmSession.class);
		
		Spot result = (Spot) session.createNativeQuery(builder.toString())
			.addEntity("Spot", Spot.class)
			.uniqueResult();
		
		return result;
	}
}
