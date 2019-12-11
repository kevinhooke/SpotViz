describe('Test menus and uploader searches', function() {
  it('Loads home page', function() {
    cy.visit('http://localhost:8080/')
    
    //body text
    cy.contains('Welcome to SpotViz!')
  })
  
  it('Shows Vizualize page', function() {
    cy.visit('http://localhost:8080/')
    cy.contains('Visualize!').click()
    cy.contains('Getting Started')
  })
  
  it('Shows How to Upload page', function() {
	    cy.visit('http://localhost:8080/')
	    cy.contains('How to upload').click()
	    cy.contains('To upload your data fies')
  })

  it('Shows Top Spot Data Uploaders', function() {
    cy.visit('http://localhost:8080/')
    cy.contains('Browse uploads').click()
    cy.contains('Show top data uploaders').click()
    
    cy.contains('Top Spot Data Uploaders')
    
    //check result
    cy.contains('2018-01-27')
  })
	  
  it('Shows List spot data by callsign', function() {
    cy.visit('http://localhost:8080/')
    cy.contains('Browse uploads').click()
    cy.contains('List spot data by callsign').click()
    
    cy.contains('Browse uploaded Spot data by Callsign')
    cy.get('input[name=callsign]').type('KK6DCT')
    cy.get('button[type=submit]').click()
    
    //check result
    cy.contains('2018-01-27')
  })
	  
})