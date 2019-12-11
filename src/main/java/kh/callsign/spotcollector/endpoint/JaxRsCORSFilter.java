package kh.callsign.spotcollector.endpoint;

import java.io.IOException;

import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ContainerResponseContext;
import javax.ws.rs.container.ContainerResponseFilter;
import javax.ws.rs.ext.Provider;

@Provider
public class JaxRsCORSFilter implements ContainerResponseFilter {

	@Override
	public void filter(ContainerRequestContext requestContext, ContainerResponseContext responseContext)
			throws IOException {
		//for local dev
		//responseContext.getHeaders().add("Access-Control-Allow-Origin", "http://localhost:8000");
		//for prod
		responseContext.getHeaders().add("Access-Control-Allow-Origin", "http://www.spotviz.info");
		responseContext.getHeaders().add("Access-Control-Allow-Headers", "origin, content-type, accept, authorization");
		responseContext.getHeaders().add("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
	}
}
