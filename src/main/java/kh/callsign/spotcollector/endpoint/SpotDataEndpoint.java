package kh.callsign.spotcollector.endpoint;

import java.net.UnknownHostException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Date;
import java.util.List;

import javax.enterprise.context.RequestScoped;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;

import kh.mongo.MongoConnection;

import com.mongodb.AggregationOutput;
import com.mongodb.BasicDBObject;
import com.mongodb.DB;
import com.mongodb.DBCollection;
import com.mongodb.DBCursor;
import com.mongodb.DBObject;
import com.mongodb.util.JSON;

@RequestScoped
@Path("/spotdata")
public class SpotDataEndpoint {

	/**
	 * Returns last 10 stored for all spotter callsigns.
	 * 
	 * @return
	 */
	@GET
	@Path("/spots")
	@Produces(MediaType.APPLICATION_JSON)
	public Response getAllSpots() {
		Response response = null;

		try {
			DB db = MongoConnection.getMongoDB();
			DBCollection col = db.getCollection("Spot");
			DBCursor c = col.find().sort(new BasicDBObject("spotReceivedTimestamp", -1)).limit(10);

			JSON json = new JSON();
			String jsonString = json.serialize(c);
			response = Response.status(Status.OK).entity(jsonString).build();
		} catch (UnknownHostException e) {
			response = Response.status(Status.INTERNAL_SERVER_ERROR).type(MediaType.TEXT_HTML_TYPE)
					.build();
		}

		return response;
	}

	/**
	 * Returns spots for given spotter callsign within date range. If no date
	 * range passed, return a summary for the given callsign.
	 * 
	 * @return
	 */
	@GET
	@Path("/spots/{callsign}")
	@Produces(MediaType.APPLICATION_JSON)
	public Response getSpotsForCallsignBetweenDateRane(@PathParam("callsign") String callsign,
			@QueryParam("fromdate") String fromDate, @QueryParam("todate") String toDate) {
		Response response = null;

		SimpleDateFormat dateFormatter = new SimpleDateFormat("yyyy/MM/dd");

		try {
			DB db = MongoConnection.getMongoDB();
			DBCollection col = db.getCollection("Spot");
			DBCursor c = null;
			String jsonString = null;

			if (callsign == null) {
				c = col.find().sort(new BasicDBObject("spotReceivedTimestamp", -1)).limit(10);
			} else {
				try {
					BasicDBObject query = new BasicDBObject("spotter", callsign);

					Date fromDateParsed = null;
					Date toDateParsed = null;
					if (fromDate != null && toDate != null) {
						fromDateParsed = dateFormatter.parse(fromDate);
						toDateParsed = dateFormatter.parse(toDate);
						query.append("spotReceivedTimestamp", new BasicDBObject("$gte",
								fromDateParsed).append("$lt", toDateParsed));
						c = col.find(query).sort(new BasicDBObject("spotReceivedTimestamp", -1))
								.limit(10);

						JSON json = new JSON();
						jsonString = json.serialize(c);

					} else {
						jsonString = this.retrieveSpotSummaryForCallsign(col, callsign);
					}

					response = Response.status(Status.OK).entity(jsonString).build();
				} catch (ParseException dfe) {
					response = Response.status(Status.INTERNAL_SERVER_ERROR)
							.entity("Date not in yyyy-MM-dd format").build();
				}
			}
		} catch (UnknownHostException e) {
			response = Response.status(Status.INTERNAL_SERVER_ERROR)
					.entity("Error connecting to MongoDB").build();
		}

		return response;

	}

	private String retrieveSpotSummaryForCallsign(DBCollection col, String callsign) {
		String jsonResult = null;
		//$match
		DBObject match = new BasicDBObject("$match", new BasicDBObject("spotter", callsign));
		
		//$group
		DBObject groupFields = new BasicDBObject( "_id", "$spotter");
		groupFields.put("firstSpot", new BasicDBObject( "$min", "$spotReceivedTimestamp"));
		groupFields.put("lastSpot", new BasicDBObject( "$max", "$spotReceivedTimestamp"));
		groupFields.put("totalSpots", new BasicDBObject( "$sum", 1));
		DBObject group = new BasicDBObject("$group", groupFields);
		
		List<DBObject> pipeline = Arrays.asList(match, group);
		
		AggregationOutput output = col.aggregate(pipeline);
		for (DBObject result : output.results()) {
			jsonResult = JSON.serialize(result);
		    break;
		}
		if(jsonResult == null){
			jsonResult = "{}";
		}
		return jsonResult;
	}
}
