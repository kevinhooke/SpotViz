package kh.callsign.spotcollector.endpoint;

import java.net.UnknownHostException;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.Iterator;
import java.util.List;

import javax.enterprise.context.RequestScoped;
import javax.json.Json;
import javax.json.JsonArrayBuilder;
import javax.json.JsonObjectBuilder;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;

import com.mongodb.AggregationOptions;
import com.mongodb.AggregationOutput;
import com.mongodb.BasicDBObject;
import com.mongodb.BasicDBObjectBuilder;
import com.mongodb.DB;
import com.mongodb.DBCollection;
import com.mongodb.DBCursor;
import com.mongodb.DBObject;
import com.mongodb.util.JSON;

import kh.mongo.MongoConnection;

@RequestScoped
@Path("/spotdata")
public class SpotDataEndpoint {

	enum HeatmapUnits{
		DAY,
		HOUR
	}
	
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
	 * Retrieves counts, first and last spots for 20 largest number of uploads.
	 */
	@GET
	@Path("/topUploads")
	@Produces(MediaType.APPLICATION_JSON)
	public Response getTopLargestUploads() {
		// db.Spot.aggregate( [ { $group : { _id : {"spotterCallsign" :
		// "$spotter"},
		// count : {$sum : 1},
		// firstSpot : {$min : "$spotReceivedTimestamp"},
		// lastSpot : {$max : "$spotReceivedTimestamp"} } } ] )
		Response response = null;
		String jsonString = null;
		StringBuilder jsonResult = new StringBuilder();
		try {
			DB db = MongoConnection.getMongoDB();
			DBCollection col = db.getCollection("Spot");

			// $group
			DBObject groupFields = new BasicDBObject("_id", "$spotter");
			groupFields.put("firstSpot", new BasicDBObject("$min", "$spotReceivedTimestamp"));
			groupFields.put("lastSpot", new BasicDBObject("$max", "$spotReceivedTimestamp"));
			groupFields.put("totalSpots", new BasicDBObject("$sum", 1));
			DBObject group = new BasicDBObject("$group", groupFields);

			List<DBObject> pipeline = Arrays.asList(group,
					new BasicDBObject("$sort", new BasicDBObject("totalSpots", -1)) 
					);

			//TODO test this and copy approach to other aggregation queries
			AggregationOptions aggregationOptions = AggregationOptions.builder()
					.outputMode(AggregationOptions.OutputMode.CURSOR).build();
			
			//AggregationOutput output = col.aggregate(pipeline);
			Iterator<DBObject> cursor =  col.aggregate(pipeline, aggregationOptions);
			jsonResult.append("{ \"topUploads\" : [ ");
			boolean firstResult = true;
			//for (DBObject result : output.results()) {
			while(cursor.hasNext()) {
				DBObject next = cursor.next();
				if (firstResult) {
					firstResult = false;
				} else {
					jsonResult.append(", ");
				}
				jsonString = JSON.serialize(next);
				jsonResult.append(jsonString);
			}
			jsonResult.append("] }");
			if (jsonString == null) {
				jsonString = "{}";
			}
			response = Response.status(Status.OK).entity(jsonResult.toString()).build();
		} catch (UnknownHostException e) {
			response = Response.status(Status.INTERNAL_SERVER_ERROR)
					.entity("Error connecting to MongoDB").build();
		}

		return response;
	}

	/**
	 * Used by getHeatmapCountsForCallsignAndDateRange(), builds $group clause for the 
	 * heatmap counts.
	 * 
	 * @return
	 */
	DBObject getAggregationQueryGroupForHeatmapCounts(HeatmapUnits unit) {

		/*
		 * {"$group": { "_id": { "$subtract": [ { "$subtract": [
		 * "$spotReceivedTimestamp", new Date("1970-01-01") ] }, { "$mod": [ {
		 * "$subtract": [ "$spotReceivedTimestamp", new Date("1970-01-01") ] },
		 * 1000 * 60 * 60 * 24 ]} ] }, count:{$sum: 1 } } }
		 */

		ZonedDateTime epoch = this.parseDateStringToUTC("1970-01-01T00:00:00+00:00");

		List<DBObject> subtractList1 = new ArrayList<>();

		List<Object> subtractList2 = new ArrayList<>();
		subtractList2.add("$spotReceivedTimestamp");
		subtractList2.add(new Date(0));// "1970-01-01T00:00:00.000Z"

		DBObject subtractTimeStampEpochDate = new BasicDBObject("$subtract", subtractList2);
		subtractList1.add(subtractTimeStampEpochDate);

		List<Object> modList1 = new ArrayList<>();
		modList1.add(subtractTimeStampEpochDate);
		
		if(unit == HeatmapUnits.DAY) {
			modList1.add(1000 * 60 * 60 * 24);
		}
		else if(unit == HeatmapUnits.HOUR){
			modList1.add(1000 * 60 * 60);
		}
		
		DBObject mod = new BasicDBObject("$mod", modList1);
		subtractList1.add(mod);

		DBObject query = BasicDBObjectBuilder.start().push("$group").push("_id")
				.add("$subtract", subtractList1)
				.pop()
				.add("count", new BasicDBObject("$sum", 1))
				.add("firstSpot", new BasicDBObject("$min", "$spotReceivedTimestamp"))
				.add("lastSpot", new BasicDBObject("$max", "$spotReceivedTimestamp"))
				.get();
		return query;
	}
	
	/**
	 * Retrieves spot counts per date for Heatmap display. Groups spot counts
	 * per day.
	 */
	/**
	 * @param callsign
	 * @param fromDate
	 * @param toDate
	 * @return
	 */
	@GET
	@Path("/heatmapCounts/{spotter}")
	@Produces(MediaType.APPLICATION_JSON)
	public Response getHeatmapCountsForCallsignAndDateRange(@PathParam("spotter") String callsign,
			@QueryParam("fromdate") String fromDate, @QueryParam("todate") String toDate) {

		/*
		 * db.Spot.aggregate( [ {$match: {spotter: "KK6DCT"}},
		 * 
		 * {"$group": { "_id": { "$subtract": [ { "$subtract": [
		 * "$spotReceivedTimestamp", new Date("1970-01-01") ] }, { "$mod": [ {
		 * "$subtract": [ "$spotReceivedTimestamp", new Date("1970-01-01") ] },
		 * 1000 * 60 * 60 * 24 ]} ] }, count:{$sum: 1 } } } ])
		 */

		/*
		 * Expected data structure in return is: { "946721039":1, "946706853":1,
		 * "946706340":1, ... }
		 */

		/*
		 * Previous attempt: //{"$group": { //"_id": { //"$subtract": ////
		 * subtract1 [ //// subtractList1 //{ "$subtract": //// subtract2 //[
		 * "$spotReceivedTimestamp", new Date("1970-01-01") ] }, ////
		 * subtract2list //// subtract2ListItem1 // List<Object> subtractList1 =
		 * new ArrayList<>(); // DBObject subtract2ListItem1 = new
		 * BasicDBObject("$spotReceivedTimestamp", "1970-01-01T00:00:00.000Z");
		 * // List<Object> subtract2List1 = new ArrayList<>(); //
		 * subtract2List1.add(subtract2ListItem1); // BasicDBObject subtract2 =
		 * new BasicDBObject("$subtract", subtract2List1); //
		 * subtractList1.add(subtract2); // BasicDBObject subtract1 = new
		 * BasicDBObject("$subtract", subtractList1);
		 * 
		 * //{ "$mod": [ // { "$subtract": ////subtract3 [
		 * ////subtract3List"$spotReceivedTimestamp", new Date("1970-01-01") ]
		 * }, // 1000 * 60 * 60 * 24 //]} // List<Object> modList = new
		 * ArrayList<>(); // List<DBObject> subtract2List = new ArrayList<>();
		 * // subtract2List.add(new BasicDBObject("$spotReceivedTimestamp",
		 * "1970-01-01T00:00:00.000Z")); // DBObject subtract3 = new
		 * BasicDBObject("$subtract", subtract2List); // modList.add(subtract3);
		 * // modList.add(new Integer(1000 * 60 * 60 * 24)); // DBObject mod =
		 * new BasicDBObject("$mod",modList); // subtractList1.add(mod); //
		 * DBObject id = new BasicDBObject("_id", subtract1); // BasicDBObject
		 * groupFields = new BasicDBObject("$group", id);
		 * 
		 * //TODO - add this back once worked out nesting //count:{$sum: 1 }
		 * //groupFields.append("count", new BasicDBObject("$sum", 1)); //] //},
		 * //} //}
		 */

		Response response = null;
		String jsonString = null;
		StringBuilder jsonResult = new StringBuilder();
		try {

			DBCursor c = null;
			DB db = MongoConnection.getMongoDB();
			DBCollection col = db.getCollection("Spot");

			// {$match: {spotter: "callsign"}},
			DBObject matchFields = new BasicDBObject("$match", new BasicDBObject("spotter",
					callsign));

			// get $group for heatmap per day
			DBObject groupFields = this.getAggregationQueryGroupForHeatmapCounts(HeatmapUnits.DAY);

			// TODO: need to append date range

			// debug
			String match = JSON.serialize(matchFields);
			System.out.println(match);
			String group = JSON.serialize(groupFields);
			System.out.println(group);

			List<DBObject> pipeline = new ArrayList<>();

			pipeline.add(matchFields);
			pipeline.add(groupFields);
			//updated to add now required cursor aggregation option
			AggregationOptions aggregationOptions = AggregationOptions.builder()
					.outputMode(AggregationOptions.OutputMode.CURSOR).build();
			Iterator<DBObject> cursor =  col.aggregate(pipeline, aggregationOptions);
			
			// TODO should data returned include pagination details
			jsonResult.append("{ \"heatmapCounts\" : [ ");
			boolean firstResult = true;
			while(cursor.hasNext()) {
				DBObject next = cursor.next();
				if (firstResult) {
					firstResult = false;
				} else {
					jsonResult.append(", ");
				}
				jsonString = JSON.serialize(next);
				jsonResult.append(jsonString);
			}
			jsonResult.append(" ] }");
			if (jsonString == null) {
				jsonString = "{}";
			}
			response = Response.status(Status.OK).entity(jsonResult.toString()).build();
		} catch (UnknownHostException e) {
			response = Response.status(Status.INTERNAL_SERVER_ERROR)
					.entity("Error connecting to MongoDB").build();
		}

		return response;
	}

	/**
	 * Retrieves spot counts per date for Heatmap display. Groups spot counts
	 * per day.
	 */
	/**
	 * @param callsign
	 * @param fromDate
	 * @param toDate
	 * @return
	 */
	@GET
	@Path("/heatmapCounts/{spotter}/hour")
	@Produces(MediaType.APPLICATION_JSON)
	public Response getHeatmapCountsForCallsignAndDateRangeForDay(@PathParam("spotter") String callsign,
		@QueryParam("fromDate") String fromDate,
		@QueryParam("toDate") String toDate)
	{

		/*
		 * Expected data structure in return is: { "946721039":1, "946706853":1,
		 * "946706340":1, ... }
		 */

/*

db.Spot.aggregate([ 
{ $match : { "spotter" : "KK6DCT", "spotReceivedTimestamp" : { $gte : ISODate( "2018-06-28T00:00:00Z"), $lt : ISODate( "2018-06-28T23:59:59Z") } } }, 
{ $group : { "_id" : 
	{ 
	  "year" : { "$year" : "$spotReceivedTimestamp" },
	  "month" : { "$month" : "$spotReceivedTimestamp"  },
	  "day" : { "$dayOfMonth" : "$spotReceivedTimestamp" },
	  "hour" : { "$hour" : "$spotReceivedTimestamp" }
	},
	count: { $sum:1} } },
{ $sort : { _id : 1 } }
])

 
 */
		Response response = null;
		String jsonString = null;
		StringBuilder jsonResult = new StringBuilder();
		try {

			DBCursor c = null;
			DB db = MongoConnection.getMongoDB();
			DBCollection col = db.getCollection("Spot");

			//String startDateString = selectedDate + "T00:00:00+00:00";
			ZonedDateTime start = this.parseDateStringToUTC(fromDate);
			
			//String endDateString = selectedDate + "T23:59:59+00:00";
			ZonedDateTime end = this.parseDateStringToUTC(toDate);
			
			// {$match: {spotter: "callsign"}},
			DBObject matchFields = new BasicDBObject("$match", 
					new BasicDBObject("spotter",callsign)
					.append("spotReceivedTimestamp", 
							new BasicDBObject("$gte", Date.from(start.toInstant())) //TODO
								.append("$lte", Date.from(end.toInstant())))
					);
			
			// get $group
			DBObject groupFields = this.getAggregationQueryGroupForHeatmapCounts(HeatmapUnits.HOUR);


			// debug
			String match = JSON.serialize(matchFields);
			System.out.println(match);
			String group = JSON.serialize(groupFields);
			System.out.println(group);

			List<DBObject> pipeline = new ArrayList<>();

			pipeline.add(matchFields);
			pipeline.add(groupFields);
			pipeline.add(new BasicDBObject("$sort", new BasicDBObject("_id", 1)));
			//updated to add now required cursor aggregation option
			AggregationOptions aggregationOptions = AggregationOptions.builder()
					.outputMode(AggregationOptions.OutputMode.CURSOR).build();
			Iterator<DBObject> cursor =  col.aggregate(pipeline, aggregationOptions);
			
			// TODO should data returned include pagination details
			jsonResult.append("{ \"heatmapCounts\" : [ ");
			boolean firstResult = true;
			while(cursor.hasNext()) {
				DBObject next = cursor.next();
				if (firstResult) {
					firstResult = false;
				} else {
					jsonResult.append(", ");
				}
				jsonString = JSON.serialize(next);
				jsonResult.append(jsonString);
			}
			jsonResult.append(" ] }");
			if (jsonString == null) {
				jsonString = "{}";
			}
			response = Response.status(Status.OK).entity(jsonResult.toString()).build();
		} catch (UnknownHostException e) {
			response = Response.status(Status.INTERNAL_SERVER_ERROR)
					.entity("Error connecting to MongoDB").build();
		}

		return response;
	}

	
	/**
	 * Returns spots for given spotter callsign within date range. If no date
	 * range passed, return a summary for the given callsign.
	 * 
	 * @param callsign
	 *            spotter callsign
	 * @param fromdate
	 *            starting date for spots
	 * @param todate
	 *            retrieve spots up to this maximum date
	 * @param interval
	 *            the length of time for an array of spots
	 * @param flatPages
	 *            if true, retrieves up to the maxiumum number of spots per
	 *            page, otherwise returns results as a nested array of arrays,
	 *            with each nested array containing the spots for that interval
	 * @return
	 */
	@GET
	@Path("/spots/{callsign}")
	@Produces(MediaType.APPLICATION_JSON)
	public Response getSpotsForCallsignBetweenDateRange(@PathParam("callsign") String callsign,
			@QueryParam("fromdate") String fromDate, @QueryParam("todate") String toDate,
			@QueryParam("interval") int interval, @QueryParam("flatpages") Boolean flatPages) {
		Response response = null;

		// flatpages defaults to true
		if (flatPages == null) {
			flatPages = Boolean.TRUE;
		} else {
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

					// todo: if flatpages, retrieve up to the maximum number of
					// spots
					// in one page, otherwise return the nested arrarys of
					// arrays

					// todo: retrieve multiple arrays of spots, each array per
					// interval
					// assemble array of arrays (JSONP) for response up to
					// maxIntervals
					// starting point: maxSpots=100, so if interval=15mins,
					// retrieve
					// spots for 15mins, add to array, if total spots so far <
					// 100
					// then retrieve next 15min interval, add to array, and
					// repeat

					// first retrieve: startDate to startDate + interval
					// (lastDateRetrieved)
					// next retrieve: lastDateRetrieved to
					// lastDateRetrieved+interval
					// continue up to max spots, or up to lastDateRetrieved =>
					// fromDate

					ZonedDateTime fromDateParsed = null;
					ZonedDateTime toDateParsed = null;

					if (fromDate != null && toDate != null) {
						fromDateParsed = parseDateStringToUTC(fromDate);
						toDateParsed = parseDateStringToUTC(toDate);

						if (flatPages) {
							// build flat document of results
							jsonString = retrieveSinglePage(callsign, fromDateParsed, toDateParsed,
									c, col);
						} else {
							// build paginated nested docs of results
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

	@GET
	@Path("/pagedspots/{callsign}")
	@Produces(MediaType.APPLICATION_JSON)
	public Response getPaginatedSpotsForCallsignFromDate(@PathParam("callsign") String callsign,
			@QueryParam("fromdate") String fromDate,
			@QueryParam("direction") @DefaultValue("next") String direction,
			@DefaultValue("10") @QueryParam("pageSize") int pageSize) {
		Response response = null;
		
		try {
			DB db = MongoConnection.getMongoDB();
			DBCollection col = db.getCollection("Spot");
			DBCursor c = null;
			String jsonString = null;

			try {
				ZonedDateTime fromDateParsed = null;

				if (fromDate != null) {
					fromDateParsed = parseDateStringToUTC(fromDate);

					BasicDBObject query = new BasicDBObject("spotter", callsign);
					query.append(
							"spotReceivedTimestamp",
							//new BasicDBObject(getPaginationQueryCondition(direction),
							new BasicDBObject("$gte",
									Date.from(fromDateParsed.toInstant())));

					// retrieve up to pageSize
					c = col.find(query).sort(new BasicDBObject("spotReceivedTimestamp", 1)).limit(pageSize);
					jsonString = JSON.serialize(c);
				}

				response = Response.status(Status.OK)
                                        .header("Access-Control-Allow-Origin", "*")
                                        .entity(jsonString).build();
			} catch (DateTimeParseException dtpe) {
				dtpe.printStackTrace();
				response = Response.status(Status.INTERNAL_SERVER_ERROR)
						.entity("Date not in yyyy/MM/dd format").build();
			}
		} catch (UnknownHostException e) {
			response = Response.status(Status.INTERNAL_SERVER_ERROR)
					.entity("Error connecting to MongoDB").build();
		}
		return response;
	}

	private String getPaginationQueryCondition(String direction) {
		String condition = null;
		if(direction.equals("next")){
			condition = "$gte";
		}
		else{
			condition = "$lte";
		}
		return condition;
	}

	private String retrieveSinglePage(String spotterCallsign, ZonedDateTime startDateCurrentPage,
			ZonedDateTime endDateCurrentPage, DBCursor c, DBCollection col) {
		// TODO: needs to retrieve spots only where lat/log is available
		String jsonString = null;
		BasicDBObject query = new BasicDBObject("spotter", spotterCallsign);
		query.append("spotReceivedTimestamp",
				new BasicDBObject("$gte", Date.from(startDateCurrentPage.toInstant())).append(
						"$lt", Date.from(endDateCurrentPage.toInstant())));
		// max 2000 spots per interval
		c = col.find(query).sort(new BasicDBObject("spotReceivedTimestamp", 1)).limit(6000);

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

		// start building result doc
		JsonObjectBuilder builder = Json.createObjectBuilder();
		JsonArrayBuilder spotsPerIntervalBuilder = Json.createArrayBuilder();
		/*
		 * 
		 * "itemsThisPage" : n, "incrementSize" : 15, "moreItems": true
		 */
		builder.add("incrementSize", interval);

		// while the end DateTime of the current page is < requested end date
		while (endDateCurrentPage.isBefore(toDateParsed)) {
			BasicDBObject query = new BasicDBObject("spotter", callsign);
			query.append(
					"spotReceivedTimestamp",
					new BasicDBObject("$gte", startDateCurrentPage).append("$lt",
							Date.from(endDateCurrentPage.toInstant())));

			// max 200 spots per interval
			c = col.find(query).sort(new BasicDBObject("spotReceivedTimestamp", 1)).limit(200);

			JSON json = new JSON();
			jsonString = json.serialize(c);
		}
		return jsonString;
	}

	private String retrieveSpotSummaryForCallsign(DBCollection col, String callsign) {
		String jsonResult = null;
		// $match
		DBObject match = new BasicDBObject("$match", new BasicDBObject("spotter", callsign));

		// $group
		DBObject groupFields = new BasicDBObject("_id", "$spotter");
		groupFields.put("firstSpot", new BasicDBObject("$min", "$spotReceivedTimestamp"));
		groupFields.put("lastSpot", new BasicDBObject("$max", "$spotReceivedTimestamp"));
		groupFields.put("totalSpots", new BasicDBObject("$sum", 1));
		DBObject group = new BasicDBObject("$group", groupFields);

		List<DBObject> pipeline = Arrays.asList(match, group);
		
		//TODO test this and copy approach to other aggregation queries
		AggregationOptions aggregationOptions = AggregationOptions.builder()
				.outputMode(AggregationOptions.OutputMode.CURSOR).build();
		//AggregationOutput output = col.aggregate(pipeline);
		Iterator<DBObject> cursor =  col.aggregate(pipeline, aggregationOptions);
		while(cursor.hasNext()) {
			DBObject next = cursor.next();
			jsonResult = JSON.serialize(next);
		}
		if (jsonResult == null) {
			jsonResult = "{}";
		}
		return jsonResult;
	}
}
