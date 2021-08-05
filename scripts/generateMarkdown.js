var fs = require('fs');
var showdown  = require('showdown');

var sourceDoc = process.argv[2]

var data =  fs.readFileSync(sourceDoc, 'utf-8', function(e, data){
    return data
});

var translate = new showdown.Converter();
translate.setFlavor('github');
translate.setOption('simpleLineBreaks', false);
translate.setOption('emoji', true);
translate.setOption('smoothLivePreview', true);

var html = translate.makeHtml(data);
console.log(html)