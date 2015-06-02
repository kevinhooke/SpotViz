describe('callsign search', function() {
  it('should show error for unknown callsign', function() {
    browser.get('http://localhost:8080/#/visualize/callsign');

    element(by.model('search.callsign')).sendKeys('aaa');
    element(by.css('.btn')).click();

    //    expect(element(by.css(('panel-title')).isDisplayed())).toBe(true);


    var error = element(by.css('.panel-title'));
    expect(error.isPresent()).toBe(true);

  });
});