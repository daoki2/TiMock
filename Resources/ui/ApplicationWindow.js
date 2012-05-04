/**
 * TiMock
 * @author Copyright (c) 2012 daoki2
 * @version 1.0.0
 * 
 * Copyright (c) 2012 daoki2
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/**
 * Note:
 * uncomment below and build when you install to real device
 */ 
//require("api/Includes");

function ApplicationWindow() {
	var self = Ti.UI.createWindow({
		backgroundColor: '#fff'
	});
	
	var current;
	var filename;
	
	// Searcher for finding timock services
	var serviceBrowser = Titanium.Network.createBonjourBrowser({
		serviceType:'_timock._tcp',
		domain:'local.'
	});
	serviceBrowser.addEventListener('updatedServices', function(e) {
		Ti.API.info("updateService");
		var data = [];
		services = e['services'];

		for (var i = 0; i < services.length; i++) {
			var service = services[i];
			var row = {title: service.name, hasChild:false, service: service};

			if (service.socket == null || !service.socket.isValid) {
				service.resolve();
				service.socket.addEventListener('read', function(x) {
					
					if (x['data'].text !== undefined) {
						var cmd = x['data'].text.substring(0, 5);
						switch(cmd) {
						case "code:": // If received code
							try {
								if (current && current.close !== undefined) {
									current.close();
								}
					
								current = eval(x['data'].text.substring(5));
						
								if (current && current.open !== undefined) {
									current.open();
								}
							} catch (e) {
								var error_message;
      							if(e.line === undefined) {
        							error_message = e.toString();
      							} else { //iOS Error
        							error_message = "Line " + e.line + ": " + e.message;
      							}
								alert(error_message);
							}
							break;
						case "file:": // If received filename
							filename = x['data'].text.substring(5);
							alert("Copy file " + filename);
							var file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, filename);
							if (file.exists()) {
								file.deleteFile();					
							}
							file.createFile();					
							service.socket.write('file '); // add padding to the end
							break;
						default: // Unknown command
							alert(cmd);
							break;
						}
					} else { // got file data
						var file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, filename);
						if (file.exists()) {
							file.append(x['data']);
						}
					}
				});
				service.socket.connect();
			}

			data.push(row);
		}

		if (data.length == 0) {
			data.push({title: 'No services', hasChild:false});
			if (current && current.close !== undefined) {
				current.close();
				current = null;
			}
		}
		tableView.setData(data);
	});

	var tableView = Titanium.UI.createTableView({
		style:Titanium.UI.iPhone.TableViewStyle.GROUPED,
		data:[{title:'No services', hasChild:false}]
	});
	tableView.addEventListener('click', function(r) {
		var service = r['rowData'].service;
		if (service !== undefined) {
			service.socket.write("Connected "); // add padding to the end
			tableView.setData([{title: 'Connected', hasChild:false}]);
		}
	});
	
	self.add(tableView);
	serviceBrowser.search();

	return self;
}

module.exports = ApplicationWindow;