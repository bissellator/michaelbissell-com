// node modules
const fs = require('fs');
var showdown  = require('showdown')
converter = new showdown.Converter()
var syncreq = require('sync-request');
var http = require('http');
var localpath = process.argv[2];
if (typeof localpath == "undefined") {localpath = './'}
var webhost = "https://michaelbissell.com"
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
var pageBlurb = ''
var pageImage = '/images/bissellator.jpeg'

const port = 8013

console.log("listening on http://localhost:" + port)
var server = http.createServer(function (req, res) {
  header = template[0]
  footer = template[1]

  var pageURL = webhost + req.url
  header = header.replace(/fSITENAME/g, siteName)
  header = header.replace(/fPAGEURL/g, pageURL)


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
  if (ext == "rss") {contentType = "application/rss+xml"}

  // return podcast rss
  if (pathels[1] == "podcast.rss") {
    contentType = "application/rss+xml"
    try {
      var tmp = fs.readFileSync( localpath + '/objects/rss-outer.xml' )
      var msg = tmp.toString()

      var podcastXML = fs.readFileSync( localpath + '/objects/rss-item.xml' )
      podcastXML = podcastXML.toString()
      var items = syncreq('GET', uxapihost + '/v1/pages?podcast=http*', {})
      items = JSON.parse(items.body.toString())
      var podcastList = ""
      for (var i =0; i < items.objects.length; i++ ) {
        var tmp = podcastXML
        var object = items.objects[i].object
        object.blurb = object.blurb.replace(/\n/g, " ")
        object.blurb = object.blurb.replace(/\r/g, "")
        object.pagesbody = object.pagesbody.replace(/\n/g, '<BR />')
        tmp = tmp.replace(/fSITENAME/g, siteName)
        tmp = tmp.replace(/fPAGESNAME/g, object.pagesname)
        tmp = tmp.replace(/fPAGESBODY/g, object.pagesbody)
        tmp = tmp.replace(/fBLURB/g, object.blurb)
        tmp = tmp.replace(/fPODCAST/g, object.podcast)
        tmp = tmp.replace(/fDURATION/g, object.podcastduration)
        tmp = tmp.replace(/fFILESIZE/g, object.podcastfilesize)
        tmp = tmp.replace(/fOBJECTID/g, 'https://michaelbissell.com/' + items.objects[i].objectID + '/' + encodeURIComponent(object.pagesname.replace(/\ /g, '-')) )
        var pubdate = new Date(items.objects[i].created)
        pubdate = pubdate.toUTCString();
        pubdate = pubdate.replace(/GMT/, '+0000')

//        pubdate = pubdate.split('(')[0]
        tmp = tmp.replace(/fPUBDATE/g, pubdate)
        podcastList= podcastList+tmp
      }

      var msg = msg.replace(/fITEMS/, podcastList)


      res.writeHead(200, {'Content-Type': contentType});
      res.end(msg); // Send the file data to the browser.
      return
    }catch (err){ console.log(err)}
  }

  // Return images from the API image library
  if (pathels[1] == 'images' && pathels[2] == 'library') {
    var imgresp = {}
    var respayload = ""
    try {
      var objectID = pathels[3].split('.')[0]
      imgresp = syncreq('GET', uxapihost + "/v1/pages/" + objectID, {})
      imgresp = JSON.parse(imgresp.body.toString())
      if (typeof(imgresp.error) == 'undefined') {
        var obj = JSON.parse(JSON.stringify(imgresp))
        if (typeof(obj.object) != 'undefined') {
          if (typeof(obj.object.socialimage) != 'undefined') {
            let text = obj.object.socialimage.split(`,`)
            if (text[0].substring(0,5) == 'data:') {
              conentType=text[0].split(':')[1]
              // let buff = new Buffer(text, 'base64');
              let buff = Buffer.from(text[1], "base64");
              respayload = buff
            }
            else {
              contentType = "image/gif"
              resppayload = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAQAIBRAA7";
            }
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
      articles.object.blurb = articles.object.blurb.replace(/\n/g, " ")
      msg = msg + "<div class=markdown>" + html + "</div>"
      header = header.replace(/fPAGENAME/g, '')

      header = header.replace(/fPAGEIMAGE/g, pageImage)
      header = header.replace(/fPAGEBLURB/g, articles.object.blurb.replace(/\"/g, "'"))

      footer = footer.replace(/fBLOGMENU/g, blogmenu())
      footer = footer.replace(/fPAGESMENU/g, pagemenu())
      res.writeHead(200, {'Content-Type': contentType});
      res.end(header + msg + footer); // Send the file data to the browser.
      return;
    }
    else {
      msg = `
        <h2>Sorry...</h2>
        <p>It looks like the pagesID object <I>` + pathels[1] + `</I> doesn't exist</p>
      `
      header = header.replace(/fPAGENAME/g, 'Error')
      header = header.replace(/fPAGEIMAGE/g, pageImage)
      header = header.replace(/fPAGEBLURB/g, '')

      footer = footer.replace(/fBLOGMENU/g, blogmenu())
      footer = footer.replace(/fPAGESMENU/g, pagemenu())

      res.writeHead(404, {'Content-Type': contentType});
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
      try {
        pageName = articles.object.pagesname
      }catch {pageName = "Error";}
      if (typeof(articles.object) != 'undefined') {
        msg = "<h1 style='padding-bottom:0px;margin:0px'>" + articles.object.pagesname + "</h1><p>" + articles.object.posted + "</p>"
        converter = new showdown.Converter(),
        text      = articles.object.pagesbody,
        html      = converter.makeHtml(text);

        if (articles.object.socialimage.length > 1) {
          if (articles.object.socialimage.substring(0,4) == 'data') {
            var imgtype = articles.object.socialimage.split(';')
            imgtype = imgtype[0].split('/')[1]
            pageImage = '/images/library/' + articles.objectID + '.' + imgtype
          }
          else {
            pageImage = articles.object.socialimage
          }
        }
        articles.object.blurb = articles.object.blurb.replace(/\n/g, " ")

        msg = msg + "<div class=markdown>" + html + "</div>"

        try {
          if (articles.object.podcast.substring(0,4) == 'http') {
            var msg = msg + `
            <p>Listen to the podcast:</p>
              <div>
                <audio controls>
                  <source src="` + articles.object.podcast + `" type="audio/mpeg">
                  Your browser does not support the audio element.
                </audio>
              </div>
            `
          }
        }catch {}

        msg = msg + `<script>if (typeof(window.sessionStorage.token) != 'undefined') {document.write('<p><a href=/admin/editpage.html?objectID=` + pathels[1] + `>edit</a></p>')}</script>`


        header = header.replace(/fPAGENAME/g, pageName)
        header = header.replace(/fPAGEIMAGE/g, pageImage)
        header = header.replace(/fPAGEBLURB/g, articles.object.blurb.replace(/\"/g, "'"))

        footer = footer.replace(/fBLOGMENU/g, blogmenu() + `<script>document.getElementById('` + pathels[1] + `.menu').scrollIntoView();window.scrollTo(0,0)</script>`  )
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
        header = header.replace(/fPAGENAME/g, '')
        header = header.replace(/fPAGEIMAGE/g, pageImage)
        header = header.replace(/fPAGEBLURB/g, '')

        footer = footer.replace(/fBLOGMENU/g, blogmenu())
        footer = footer.replace(/fPAGESMENU/g, pagemenu())

        res.writeHead(404, {'Content-Type': contentType});
        res.end(header + msg + footer); // Send the file data to the browser.
        return;
      }
    }
  }

  try {
    var stats = fs.statSync(localpath + 'website' + path)
    if (stats.isDirectory() == true) {
      res.writeHead(403, {'Content-Type': 'text/html'})

      header = header.replace(/fPAGENAME/g, 'Error')
      header = header.replace(/fPAGEIMAGE/g, pageImage)
      header = header.replace(/fPAGEBLURB/g, '')

      footer = footer.replace(/fBLOGMENU/g, blogmenu())
      footer = footer.replace(/fPAGESMENU/g, pagemenu())


      res.end(header + '<h1>403: Directory listing not allowed</h1><p>Sorry, this is a directory without an index</p>' + footer)
      return
    }
  }catch {
    res.writeHead(404, {'Content-Type': 'text/html'})

    header = header.replace(/fPAGENAME/g, 'Error Not Found')
    header = header.replace(/fPAGEIMAGE/g, pageImage)
    header = header.replace(/fPAGEBLURB/g, '')

    footer = footer.replace(/fBLOGMENU/g, blogmenu())
    footer = footer.replace(/fPAGESMENU/g, pagemenu())

    res.end(header + `<h1>404: Not Found</h1><p>Sorry, we weren't able to find the page you're looking for</p><p>` + verb + " " + path + "</p>" + footer)
    return
  }
  fs.readFile(localpath + 'website' + path, function(err, data) {
        if (err) throw err
        if (contentType == 'text/html') {

          header = header.replace(/fPAGENAME/g, pageName)
          header = header.replace(/fPAGEIMAGE/g, pageImage)
          header = header.replace(/fPAGEBLURB/g, '')

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
  var pages = syncreq('GET', uxapihost + '/v1/pages?category=blog&sortBy=posted&sortOrder=desc&page=' + page + '&size=1000', {})
  pages = JSON.parse(pages.body.toString())
  for (var i =0; i < pages.objects.length; i++) {
    msg = msg + `<A id="` + pages.objects[i].objectID + `.menu" href="/` + pages.objects[i].objectID + `/` + encodeURIComponent(pages.objects[i].object.pagesname.replace(/\ /g, '-')) + `">` + pages.objects[i].object.pagesname + `</a><br/>`
  }
  return msg;
}

function pagemenu(page, size) {
  if (typeof(page) == 'undefined') { page =0 }
  if (typeof(size) == 'undefined') { size =50 }
  var msg = ""
  var pages = syncreq('GET', uxapihost + '/v1/pages?category=page&sortBy=orderby&sortOrder=asc&page=' + page + '&size=' + size, {})
  pages = JSON.parse(pages.body.toString())
  for (var i =0; i < pages.objects.length; i++) {
    msg = msg + `<li><A href="/` + pages.objects[i].objectID + `/` + encodeURIComponent(pages.objects[i].object.pagesname.replace(/\ /g, '-')) + `">` + pages.objects[i].object.pagesname + `</a></li>`
  }
  return msg;
}
