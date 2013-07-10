#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var util = require('util');
var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var CHECKSFILE_DEFAULT = "checks.json";
var DLHTMLFILE_DEFAULT = "donwloadedindex.html";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var buildfn = function(checksfile) {
    var response2file = function(result, response) {
	if (result instanceof Error) {
	    console.log('Error: ' + util.format(result.message));
	} 
	else {
	    fs.writeFileSync(DLHTMLFILE_DEFAULT, result);
	    checkHtmlFile(DLHTMLFILE_DEFAULT, checksfile);
	}
    };
    return response2file;
}

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var checkJson = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        checkJson[checks[ii]] = present;
    }
    var outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists))
        .option('-u, --url <url>', 'URL of index.html')
        .parse(process.argv);
    if (program.file && !program.url) {
	checkHtmlFile(program.file, program.checks);
    }
    else if (!program.file && program.url) {
	var response2file = buildfn(program.checks);
	rest.get(program.url).on('complete', response2file);
    }
    else {
	console.log("Invalid arguments. Provide either URL or file.");
    }	
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
