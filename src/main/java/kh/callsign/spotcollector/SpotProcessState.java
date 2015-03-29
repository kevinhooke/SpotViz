package kh.callsign.spotcollector;

public enum SpotProcessState {
	Success,
	Error_AlreaySubmitted,
	Error_HamQTHLookup_CallNotKnown,
	Error_HamQTHLookup_NoLocationData
}
