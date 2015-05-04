package kh.callsign.spotcollector.endpoint;

import java.net.UnknownHostException;
import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.Date;
import java.util.List;

import javax.enterprise.context.RequestScoped;
import javax.json.Json;
import javax.json.JsonArrayBuilder;
import javax.json.JsonObjectBuilder;
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

	private DateTimeFormatter dateFormatter = DateTimeFormatter.ISO_DATE_TIME;

	
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
	 * @param callsign spotter callsign
	 * @param fromdate starting date for spots
	 * @param todate retrieve spots up to this maximum date
	 * @param interval the length of time for an array of spots
	 * @param flatPages if true, retrieves up to the maxiumum number of spots per page, otherwise
	 * returns results as a nested array of arrays, with each nested array containing the spots
	 * for that interval
	 * @return
	 */
	@GET
	@Path("/spots/{callsign}")
	@Produces(MediaType.APPLICATION_JSON)
	public Response getSpotsForCallsignBetweenDateRane(@PathParam("callsign") String callsign,
			@QueryParam("fromdate") String fromDate, 
			@QueryParam("todate") String toDate,
			@QueryParam("interval") int interval,
			@QueryParam("flatpages") Boolean flatPages) {
		Response response = null;
		
		//flatpages defaults to true
		if(flatPages == null){
			flatPages = Boolean.TRUE;
		} 
		else{
			flatPages = Boolean.FALSE;
		}
		

		try {
			DB db = MongoConnection.getMongoDB();
			DBCollection col = db.getCollection("Spot");
			DBCursor c = null;
			String jsonString = null;

			if (callsign == null) {
				c = col.find().sort(new BasicDBObject("spotReceivedTimestamp", 1)).limit(10);
			} else {
				try {
					
					//todo: if flatpages, retrieve up to the maximum number of spots
					//in one page, otherwise return the nested arrarys of arrays
					
					
					//todo: retrieve multiple arrays of spots, each array per interval
					//assemble array of arrays (JSONP) for response up to maxIntervals
					//starting point: maxSpots=100, so if interval=15mins, retrieve
					//spots for 15mins, add to array, if total spots so far < 100
					//then retrieve next 15min interval, add to array, and repeat
					
					//first retrieve: startDate to startDate + interval (lastDateRetrieved)
					//next retrieve: lastDateRetrieved to lastDateRetrieved+interval
					//continue up to max spots, or up to lastDateRetrieved => fromDate
					

					ZonedDateTime fromDateParsed = null;
					ZonedDateTime toDateParsed = null;

					
					if (fromDate != null && toDate != null) {
						fromDateParsed = parseDateStringToUTC(fromDate);
						toDateParsed = parseDateStringToUTC(toDate);
						
						if(flatPages){
							//build flat document of results
							jsonString = retrieveSinglePage(callsign, fromDateParsed, 
									toDateParsed, c, col);
						}
						else{
							//build paginated nested docs of results
							jsonString = buildPaginatedSearchResult(callsign, interval, col,
									jsonString, fromDateParsed, toDateParsed);							
						}
					} else {
						jsonString = this.retrieveSpotSummaryForCallsign(col, callsign);
					}

					response = Response.status(Status.OK).entity(jsonString).build();
				} catch (DateTimeParseException dtpe) {
					dtpe.printStackTrace();
					response = Response.status(Status.INTERNAL_SERVER_ERROR)
							.entity("Date not in yyyy/MM/dd format").build();
				}
			}
		} catch (UnknownHostException e) {
			response = Response.status(Status.INTERNAL_SERVER_ERROR)
					.entity("Error connecting to MongoDB").build();
		}

		return response;

	}

	ZonedDateTime parseDateStringToUTC(String fromDate) {
		return ZonedDateTime.parse(fromDate, dateFormatter);
	}

	private String retrieveSinglePage(String spotterCallsign, ZonedDateTime startDateCurrentPage, 
			ZonedDateTime endDateCurrentPage, DBCursor c, DBCollection col) {
		String jsonString = null;
		BasicDBObject query = new BasicDBObject("spotter", spotterCallsign);
		query.append("spotReceivedTimestamp", 
				new BasicDBObject("$gte", Date.from(startDateCurrentPage.toInstant()))
					.append("$lt", Date.from(endDateCurrentPage.toInstant())));
		c = col.find(query).sort(new BasicDBObject("spotReceivedTimestamp", 1))
				.limit(200); //max 200 spots per interval
		
		jsonString = JSON.serialize(c);
		return jsonString;
	}

	private String buildPaginatedSearchResult(String callsign, int interval, DBCollection col,
			String jsonString, ZonedDateTime fromDateParsed, ZonedDateTime toDateParsed) {
		DBCursor c;
		ZonedDateTime startDateCurrentPage;
		ZonedDateTime endDateCurrentPage;
		startDateCurrentPage = fromDateParsed;
		endDateCurrentPage = startDateCurrentPage.plus(interval, ChronoUnit.MINUTES);
		
		//start building result doc
		JsonObjectBuilder builder = Json.createObjectBuilder();
		JsonArrayBuilder spotsPerIntervalBuilder = Json.createArrayBuilder();
		/*

		  "itemsThisPage" : n,
		  "incrementSize" : 15,
		  "moreItems": true
		  
		  */
		builder.add("incrementSize", interval);
		
		//while the end DateTime of the current page is < requested end date
		while(endDateCurrentPage.isBefore(toDateParsed)){
			BasicDBObject query = new BasicDBObject("spotter", callsign);
			query.append("spotReceivedTimestamp", new BasicDBObject("$gte",
					startDateCurrentPage).append("$lt", Date.from(endDateCurrentPage.toInstant())));
			c = col.find(query).sort(new BasicDBObject("spotReceivedTimestamp", 1))
					.limit(200); //max 200 spots per interval
			
			JSON json = new JSON();
			jsonString = json.serialize(c);
			
			//TODO here - build array of results then add to array
			
		}
		return jsonString;
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
