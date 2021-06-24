import requests
import untangle

service_endpoint = "http://uhf.microsoft.com"
partner_id = "VCPKG"
header_id = "VCPKGHeader-real"
footer_id = "VCPKGFooter"
user_agent = "Microsoft"
locale = "en-US"
service_url = service_endpoint + "/" + locale + "/shell/xml/" + partner_id
+ "?headerId=" + header_id + "&footerId=" + footer_id

r = requests.get(service_url, headers={'user-agent': user_agent})
xml = untangle.parse(r.text)
css = xml.shell.cssIncludes.cdata
js = xml.shell.javascriptIncludes.cdata
header = xml.shell.headerHtml.cdata
footer = xml.shell.footerHtml.cdata
# print()
output = open("css.html", mode='w')
output.write(str(css))
output.close()
output = open("js.html", mode='w')
output.write(str(js))
output.close()
output = open("header.html", mode='w')
output.write(str(header))
output.close()
output = open("footer.html", mode='w')
output.write(str(footer))
output.close()
# print(r.text)
