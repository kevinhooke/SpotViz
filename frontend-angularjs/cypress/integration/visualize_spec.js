describe('Test Visualize', function() {
	  
  it('Seaches spots and selects date range', function() {
    cy.visit('http://localhost:8080/')
    cy.contains('Visualize').click()
    cy.contains('To visualize your historical data')
    
    cy.get('input[id=callsign]').type('KK6DCT')
    cy.get('button').click()
    
    //check result
    cy.contains('Available data for callsign')
    cy.get('input[value="Continue to select date range?"]').click()
    cy.contains('Select Date Range for Visualization Playback')
    
    //get first hours input (from)
  	cy.get('input[ng-model="hours"]').first()
  		.type("{del}{del}{backspace}{backspace}01")    
    cy.get('input[ng-model="minutes"]').first()
    	.type("{del}{del}{backspace}{backspace}00")
    
    //to
  	cy.get('input[ng-model="hours"]').eq(1)
  		.type("{del}{del}{backspace}{backspace}23")    
    cy.get('input[ng-model="minutes"]').eq(1)
    	.type("{del}{del}{backspace}{backspace}00")    

    cy.get('.btn-primary').eq(0).click()
    cy.contains('Distribution of data')
    	
    cy.contains('220 items on Friday').click({force: true})
    
    //check dialog
    cy.contains('Spot Data for day "2018-01-27T00:00:00.000Z"')
    cy.contains('First spot received at: 2018-01-27T22:28:30.000Z')
    cy.contains('Last spot received at: 2018-01-27T22:43:15.000Z')
    cy.contains('Spot count total for day: 220')
  })
	  
})