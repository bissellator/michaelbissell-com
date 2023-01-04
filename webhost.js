// node modules
const fs = require('fs');
var showdown  = require('showdown')
converter = new showdown.Converter()
var syncreq = require('sync-request');
var http = require('http');
var localpath = process.argv[2];
if (typeof localpath == "undefined") {localpath = './'}
var uxapihost = "https://api.michaelbissell.com"
const clientID = "4nh2gusyv1od5u50a8lh8hrrm47jl914"
const clientSecret = "ko1nne920nq9opbl"
var contract = syncreq('GET', uxapihost, {})
contract = JSON.parse(contract.body.toString())

// Site config varialbes
var template = []
try {
  var tmp = fs.readFileSync( localpath + '/objects/template.html' )
  var template = tmp.toString().split('xxxSplitHerexxx')
}catch {template[0] = ""; template[1]=""}

if (typeof(template[1]) == 'undefined') {
  template[0] = ""; template[1]=""
}

var siteName = contract.info.title
var pageName = ''

const port = 8013

console.log("listening on http://localhost:" + port)
var server = http.createServer(function (req, res) {
  var data = ""
  var verb = req.method;
  var queryparams = req.url.split('?')[1]
  var qp = {}
  if (typeof(queryparams) != 'undefined') {
    var queryparams = queryparams.split('&')
    for (var i = 0; i < queryparams.length; i++) {
      var tmp = queryparams[i].split('=')
      qp[tmp[0]] = tmp[1]
    }
  }
  var path = req.url.split('?')[0];
  if (path.slice(-1) == `/`) (path = path.slice(0, -1))
  var pathels = path.split('/')

  // Assign a content type based on ext
  var tmp = path.split('.')
  var ext = (tmp[tmp.length -1])
  var contentType = "text/plain"
  if (ext == "html") {contentType = "text/html"}
  if (ext == "js") {contentType = "text/javascript"}
  if (ext == "json") {contentType = "application/json"}
  if (ext == "png") {contentType = "image/png"}
  if (ext == "gif") {contentType = "image/gif"}
  if (ext == "jpg") {contentType = "image/jpeg"}
  if (ext == "jpeg") {contentType = "image/jpeg"}
  if (ext == "css") {contentType = "text/css"}
  if (ext == "ico") {contentType = "image/x-icon"}
  if (ext == "eot") {contentType = "text/plain"}
  if (ext == "svg") {contentType = "text/plain"}
  if (ext == "ttf") {contentType = "text/plain"}
  if (ext == "map") {contentType = "text/plain"}
  if (ext == "woff") {contentType = "text/plain"}

  // Return images from the API image library
  if (pathels[1] == 'images' && pathels[2] == 'library') {
    var imgresp = {}
    var respayload = ""
    try {
      imgresp = syncreq('GET', uxapihost + "/v1/images?imagesname=" + pathels[3], {})
      imgresp = JSON.parse(imgresp.body.toString())
      if (typeof(imgresp.error) == 'undefined') {
        var obj = JSON.parse(JSON.stringify(imgresp.objects[0]))
        if (typeof(obj.object) != 'undefined') {
          if (typeof(obj.object.image) != 'undefined') {
            let text = obj.object.image.split(`,`)[1]
            // let buff = new Buffer(text, 'base64');
            let buff = Buffer.from(text, "base64");
            respayload = buff
            var imgtype = obj.object.image.split(`,`)[0]
            imgtype = imgtype.split(':')[1]
            contentType = imgtype.split(';')[0]
          }
        }
      }
    }catch (err){console.log(err)}
    res.writeHead(200, {'Content-Type': contentType});
    res.end(respayload); // Send the file data to the browser.
    return;
  }

  // redirect to index.html on `/`
  if (path == '/' || path == '') {
    path = '/index.html'; contentType="text/html"
    var articles = syncreq('GET', uxapihost + '/v1/pages?pagesname=Michael Bissell', {})
    articles = JSON.parse(articles.body.toString())
    if (typeof(articles.objects[0].object) != 'undefined') {
      articles.object = articles.objects[0].object
      msg = "<h1 style='padding-bottom:0px;margin:0px'>" + articles.object.pagesname + "</h1><p>" + articles.object.posted + "</p>"
      converter = new showdown.Converter(),
      text      = articles.object.pagesbody,
      html      = converter.makeHtml(text);

      msg = msg + "<div class=markdown>" + html + "</div>"
      header = template[0]
      footer = template[1]
      header = header.replace(/fSITENAME/g, siteName)
      header = header.replace(/fPAGENAME/g, '')
      footer = footer.replace(/fBLOGMENU/g, blogmenu())
      footer = footer.replace(/fPAGESMENU/g, pagemenu())
      res.writeHead(200, {'Content-Type': contentType});
      res.end(header + msg + footer); // Send the file data to the browser.
      return;
    }
    else {
      msg = `
        <h2>Sorry...</h2>
        <p>It looks like the pagesID <I>` + pathels[1] + `</I> doesn't exist</p>
      `
      header = template[0]
      footer = template[1]
      header = header.replace(/fSITENAME/g, siteName)
      header = header.replace(/fPAGENAME/g, '')
      footer = footer.replace(/fBLOGMENU/g, blogmenu())
      footer = footer.replace(/fPAGESMENU/g, pagemenu())

      res.writeHead(200, {'Content-Type': contentType});
      res.end(header + msg + footer); // Send the file data to the browser.
      return;
    }

  }

  // redirect to /admin/index.html on `/dashboard`
  if (path == '/admin' || path == '/admin/') {path = '/admin/index.html'; contentType="text/html"}

  if (typeof(pathels[1]) != 'undefined') {
    if(pathels[1].match(/^.{8}[-]/) != null) {
      contentType = "text/html"
      var msg = ''
      var articles = syncreq('GET', uxapihost + '/v1/pages/' + pathels[1], {})
      articles = JSON.parse(articles.body.toString())
      if (typeof(articles.object) != 'undefined') {
        msg = "<h1 style='padding-bottom:0px;margin:0px'>" + articles.object.pagesname + "</h1><p>" + articles.object.posted + "</p>"
        converter = new showdown.Converter(),
        text      = articles.object.pagesbody,
        html      = converter.makeHtml(text);

        msg = msg + "<div class=markdown>" + html + "</div>"
        header = template[0]
        footer = template[1]
        header = header.replace(/fSITENAME/g, siteName)
        header = header.replace(/fPAGENAME/g, '')
        footer = footer.replace(/fBLOGMENU/g, blogmenu())
        footer = footer.replace(/fPAGESMENU/g, pagemenu())
        res.writeHead(200, {'Content-Type': contentType});
        res.end(header + msg + footer); // Send the file data to the browser.
        return;
      }
      else {
        msg = `
          <h2>Sorry...</h2>
          <p>It looks like the pagesID <I>` + pathels[1] + `</I> doesn't exist</p>
        `
        header = template[0]
        footer = template[1]
        header = header.replace(/fSITENAME/g, siteName)
        header = header.replace(/fPAGENAME/g, '')
        footer = footer.replace(/fBLOGMENU/g, blogmenu())
        footer = footer.replace(/fPAGESMENU/g, pagemenu())

        res.writeHead(200, {'Content-Type': contentType});
        res.end(header + msg + footer); // Send the file data to the browser.
        return;
      }
    }
  }

  try {
    var stats = fs.statSync(localpath + 'website' + path)
    if (stats.isDirectory() == true) {
      res.writeHead(403, {'Content-Type': 'text/html'})
      header = template[0]
      footer = template[1]

      header = header.replace(/fSITENAME/g, siteName)
      header = header.replace(/fPAGENAME/g, 'Error')
      footer = footer.replace(/fBLOGMENU/g, blogmenu())
      footer = footer.replace(/fPAGESMENU/g, pagemenu())


      res.end(header + '<h1>403: Directory listing not allowed</h1><p>Sorry, this is a directory without an index</p>' + footer)
      return
    }
  }catch {
    res.writeHead(404, {'Content-Type': 'text/html'})
    header = template[0]
    footer = template[1]

    header = header.replace(/fSITENAME/g, siteName)
    header = header.replace(/fPAGENAME/g, 'Error Not Found')
    footer = footer.replace(/fBLOGMENU/g, blogmenu())
    footer = footer.replace(/fPAGESMENU/g, pagemenu())

    res.end(header + `<h1>404: Not Found</h1><p>Sorry, we weren't able to find the page you're looking for</p><p>` + verb + " " + path + "</p>" + footer)
    return
  }
  fs.readFile(localpath + 'website' + path, function(err, data) {
        if (err) throw err
        var header = ""
        var footer = ""
        if (contentType == 'text/html') {
          header = template[0]
          header = header.replace(/fSITENAME/g, siteName)
          header = header.replace(/fPAGENAME/g, pageName)
          footer = template[1]
          footer = footer.replace(/fBLOGMENU/g, blogmenu())
          footer = footer.replace(/fPAGESMENU/g, pagemenu())

          res.writeHead(200, {'Content-Type': contentType});
          res.end(header + data + footer); // Send the file data to the browser.
          return
        }
        else {
          res.writeHead(200, {'Content-Type': contentType});
          res.end(data); // Send the file data to the browser.
        }
  });
}).listen(port);

function blogmenu(page, size) {
  if (typeof(page) == 'undefined') { page =0 }
  if (typeof(size) == 'undefined') { size =50 }
  var msg = ""
  var pages = syncreq('GET', uxapihost + '/v1/pages?category=blog&sortBy=posted&sortOrder=desc&page=' + page + '&size=' + size, {})
  pages = JSON.parse(pages.body.toString())
  for (var i =0; i < pages.objects.length; i++) {
    msg = msg + `<A href="/` + pages.objects[i].objectID + `/` + encodeURIComponent(pages.objects[i].object.pagesname) + `">` + pages.objects[i].object.pagesname + `</a><br/>`
  }
  return msg;
}

function pagemenu(page, size) {
  if (typeof(page) == 'undefined') { page =0 }
  if (typeof(size) == 'undefined') { size =50 }
  var msg = ""
  var pages = syncreq('GET', uxapihost + '/v1/pages?category=page&sortBy=sortorder&sortOrder=desc&page=' + page + '&size=' + size, {})
  pages = JSON.parse(pages.body.toString())
  for (var i =0; i < pages.objects.length; i++) {
    msg = msg + `<li><A href="/` + pages.objects[i].objectID + `/` + encodeURIComponent(pages.objects[i].object.pagesname) + `">` + pages.objects[i].object.pagesname + `</a></li>`
  }
  return msg;
}
