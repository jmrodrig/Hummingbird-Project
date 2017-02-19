package controllers.utils;

import play.api.Play;
import play.mvc.Controller;
import play.mvc.Result;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.net.URLEncoder;

import org.apache.commons.lang3.StringEscapeUtils;
import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.DefaultHttpClient;

import org.jsoup.select.Elements;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.Jsoup;



public class HtmlFetcher extends Controller {

	private final String USER_AGENT = "Mozilla/5.0";

	// HTTP GET request
	public String fetch(String url) throws Exception {

		//String url = "http://www.google.com/search?q=developer";

		HttpClient client = new DefaultHttpClient();
		HttpGet request = new HttpGet(url);

		// add request header
		request.addHeader("User-Agent", USER_AGENT);

		HttpResponse response = client.execute(request);

		System.out.println("\nSending 'GET' request to URL : " + url);
		System.out.println("Response Code : " +
                       response.getStatusLine().getStatusCode());

		if (response.getStatusLine().getStatusCode() == 404)
			return "";

		BufferedReader rd = new BufferedReader(
                       new InputStreamReader(response.getEntity().getContent()));

		StringBuffer result = new StringBuffer();
		String line = "";
		while ((line = rd.readLine()) != null) {
			result.append(line);
		}

		return result.toString();

	}

	//Metadata Grabber
	public controllers.json.Article grabMetadataFromHtml(String html, String url) {
    String host = url.split("//",2)[1].split("/",2)[0];
		String rulesPath = Play.current().path().getAbsolutePath() + "/private/scrapingrules/";
		controllers.json.Article article = new controllers.json.Article();

		Document doc = Jsoup.parse(html);
		//Article source
		article.source = host;
		//Article url
		article.url = url;
		//Parse article title
		Rules titlerules = new Rules();
		titlerules.addRule("general","regex&&attr","meta[name=\"twitter:title\"]&&content");
		titlerules.addRule("general","regex&&attr","meta[property=\"twitter:title\"]&&content");
		titlerules.addRule("general","regex&&attr","meta[property=\"og:title\"]&&content");
		titlerules.addRule("general","regex&&attr","meta[name=\"title\"]&&content");
		titlerules.addRule("general","tag","title");

		article.title = parseByRules(doc, titlerules);

		// if (article.title.equals("")) {
		// 	titlerules = new Rules(rulesPath + "title");
		// }


		//Parse article description
		Rules descriptionrules = new Rules();
		descriptionrules.addRule("general","regex&&attr","meta[name=\"twitter:description\"]&&content");
		descriptionrules.addRule("general","regex&&attr","meta[property=\"twitter:description\"]&&content");
		descriptionrules.addRule("general","regex&&attr","meta[property=\"og:description\"]&&content");
		descriptionrules.addRule("general","regex&&attr","meta[name=\"description\"]&&content");


		article.description = parseByRules(doc, descriptionrules);

		//Parse article author
		Rules authorrules = new Rules();
		authorrules.addRule("general","regex&&attr","meta[name=\"twitter:author\"]&&content");
		authorrules.addRule("general","regex&&attr","meta[property=\"twitter:author\"]&&content");
		authorrules.addRule("general","regex&&attr","meta[property=\"og:author\"]&&content");
		authorrules.addRule("general","regex&&attr","meta[name=\"author\"]&&content");

		article.author = parseByRules(doc, authorrules);

		//Parse source icon
		Rules iconrules = new Rules();
		iconrules.addRule("general","regex&&attr","link[rel=\"shortcut icon\"]&&href");

		article.icon = parseByRules(doc, iconrules);

		//Parse article cover image
		Rules imgrules = new Rules();
		imgrules.addRule("general","regex&&attr","meta[name=\"twitter:image:src\"]&&content");
		imgrules.addRule("general","regex&&attr","meta[property=\"og:image\"]&&content");
		imgrules.addRule("general","regex&&attr","meta[itemprop=\"image\"]&&content");

		article.imageUrl = parseByRules(doc, imgrules);

		//Parse article date
		controllers.utils.Rules daterulesfile = new controllers.utils.Rules(rulesPath + "date");
		controllers.utils.Rules fromcurrenthost = daterulesfile.getRulesByHost(host);
		article.date = parseByRules(doc, fromcurrenthost);

		// parse all images within the
		// ArrayList<String> imagelinks = new ArrayList<String>();
		//
		// for (Element el : doc.select("a[href$=.jpg]"))
		// 	imagelinks.add(el.attr("href"));
		// for (Element el : doc.select("a[*$=.png]"))
		// 	imagelinks.add(el.attr("href"));
		// for (Element el : doc.select("img"))
		// 	imagelinks.add(el.attr("src"));
		//
		// article.imagelinks = imagelinks;

    return article;
	}

	private static String parseByRules(Document doc, Rules rules) {
		List<Rule> ruleslist = rules.getRulesList();
		for (Rule r : ruleslist) {
			System.out.println("GOING TO PARSEBYRULE ONLY: " + r.getValue());
			String value = parseByRule(doc, r);
			if (!value.equals("")) {
				return value;
			}
		}
		return "";
	}

	private static String parseByRule(Document doc, Rule rule) {
		String strategy = rule.getStrategy();
		String value = rule.getValue();

		if (strategy.equals("class")) {
			if (doc.select("." + value).size() > 0)
				return doc.select("." + value).first().text();
		}
		else if (strategy.equals("tag")) {
			if (doc.select(value).size()  > 0)
				return doc.select(value).first().text();
		}
		else if (strategy.equals("tag&attr")) {
			String tag = value.split("\\&",2)[0];
			String attr = value.split("\\&",2)[1];
			if (doc.select(tag + "[" + attr + "]").size() > 0)
				return doc.select(tag + "[" + attr + "]").first().attr(attr);
		}
		else if (strategy.equals("regex&&attr")) {
			String regex = value.split("\\&\\&",2)[0];
			String attr = value.split("\\&\\&",2)[1];
			if (doc.select(regex).size() > 0)
				return doc.select(regex).first().attr(attr);
		}
		return "";
	}

	public static Result fetchInstagramEmbedHTML(String link) throws Exception {
		String url = "https://api.instagram.com/oembed?omitscript=true&url=" + URLEncoder.encode(link, "UTF-8");

		HttpClient client = new DefaultHttpClient();
		HttpGet request = new HttpGet(url);

		// add request headers
		request.addHeader("User-Agent", "Mozilla/5.0");

		HttpResponse response = client.execute(request);

		System.out.println("\nSending 'GET' request to URL : " + url);
		System.out.println("Response Code : " + response.getStatusLine().getStatusCode());


		BufferedReader streamReader = new BufferedReader(new InputStreamReader(response.getEntity().getContent(), "UTF-8"));
		StringBuilder responseStrBuilder = new StringBuilder();

		String inputStr;
		while ((inputStr = streamReader.readLine()) != null)
		    responseStrBuilder.append(inputStr);
		String responseString = responseStrBuilder.toString();
		return ok(responseString);
	}

}
