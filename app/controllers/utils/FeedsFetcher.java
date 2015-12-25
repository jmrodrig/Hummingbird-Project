package controllers.utils;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.io.StringWriter;
import java.net.URLEncoder;

import java.net.URL;
import java.util.Collections;
import java.util.List;



import de.l3s.boilerpipe.BoilerpipeExtractor;
import de.l3s.boilerpipe.document.TextDocument;
import de.l3s.boilerpipe.document.TextBlock;
import de.l3s.boilerpipe.extractors.ArticleExtractor;
import de.l3s.boilerpipe.extractors.CommonExtractors;
import de.l3s.boilerpipe.sax.BoilerpipeSAXInput;
import de.l3s.boilerpipe.sax.HTMLDocument;
import de.l3s.boilerpipe.sax.HTMLFetcher;
import de.l3s.boilerpipe.sax.HTMLHighlighter;

import org.jsoup.select.Elements;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.Jsoup;

import com.google.gson.Gson;
import play.mvc.BodyParser;
import play.mvc.Http.MultipartFormData;
import play.mvc.Http.MultipartFormData.FilePart;
import play.mvc.Http.RequestBody;

import org.apache.commons.lang3.StringEscapeUtils;
import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.DefaultHttpClient;

import play.mvc.Result;
import play.mvc.Controller;

public class FeedsFetcher extends Controller {

	private final String USER_AGENT = "Mozilla/5.0";
	//private final String OAUTH_TOKEN = "A12aorYHyWu1y8zDGUAxybarj_b2Z-LyEVIuyxjB6J3KNwJXX0apFEx5MAPc7UPooZOv0yY43OUk-QVTqOw8H7xiD8iJb7x9eN1M8Mza16ZN0j0C4LrkCbPbKVhwBXzxjkwRpQC0PtVBlD3TxZexJ-hO1OMLz9j22jQg8jSJfhR_IDt75xt6rDOdG3lH2rzQW7LRiKVSzvokpU4lEqFQ9a6apZAX6qjZDA0:feedlydev";

	// HTTP GET request
	public static Result fetchCategories() throws Exception {

		String url = "http://cloud.feedly.com/v3/categories";
		String OAUTH_TOKEN = "A1it7y_rIHtTT1x9gLFdIqPiXYdmM-XouW9IOuRCgB2lN2I02eP7L8GiLZHBwU2iCk6gejHuNsYLqFQ05PFKS2EdzVNEp04h9W7L9IPwOcpSm18wZlmmMGC2n1z2n7DJcrRWKvXph8eS3InoRhkcALGQVo6EctZcuTNFjD5lXL8D4EKOseEVHkgC6jIjP2wYVx2t9E_uFBef4iaVZXapwrTESo2qB9do-_R7ZA:feedlydev";


		HttpClient client = new DefaultHttpClient();
		HttpGet request = new HttpGet(url);

		// add request headers
		request.addHeader("Authorization", "OAuth " + OAUTH_TOKEN);
		request.addHeader("Content-Type","application/json");

		HttpResponse response = client.execute(request);
		//HttpEntity resEntity = response.getEntity();

		// System.out.println("\nSending 'GET' request to URL : " + url);
		// System.out.println("Response Code : " +
    //                    response.getStatusLine().getStatusCode());


		BufferedReader streamReader = new BufferedReader(new InputStreamReader(response.getEntity().getContent(), "UTF-8"));
		StringBuilder responseStrBuilder = new StringBuilder();

		String inputStr;
		while ((inputStr = streamReader.readLine()) != null)
		    responseStrBuilder.append(inputStr);

		String responseString = responseStrBuilder.toString();

		return ok(responseString);

	}

	public static Result fetchItemsFromCategories(String categoryUri,String options) throws Exception {

		String url = "http://cloud.feedly.com/v3/streams/" + URLEncoder.encode(categoryUri, "UTF-8") + "/contents?" + options;
		String OAUTH_TOKEN = "A1it7y_rIHtTT1x9gLFdIqPiXYdmM-XouW9IOuRCgB2lN2I02eP7L8GiLZHBwU2iCk6gejHuNsYLqFQ05PFKS2EdzVNEp04h9W7L9IPwOcpSm18wZlmmMGC2n1z2n7DJcrRWKvXph8eS3InoRhkcALGQVo6EctZcuTNFjD5lXL8D4EKOseEVHkgC6jIjP2wYVx2t9E_uFBef4iaVZXapwrTESo2qB9do-_R7ZA:feedlydev";

		HttpClient client = new DefaultHttpClient();
		HttpGet request = new HttpGet(url);

		// add request headers
		request.addHeader("Authorization", "OAuth " + OAUTH_TOKEN);
		request.addHeader("Content-Type","application/json");


		HttpResponse response = client.execute(request);
		//HttpEntity resEntity = response.getEntity();

		// System.out.println("\nSending 'GET' request to URL : " + url);
		// System.out.println("Response Code : " +
    //                    response.getStatusLine().getStatusCode());


		BufferedReader streamReader = new BufferedReader(new InputStreamReader(response.getEntity().getContent(), "UTF-8"));
		StringBuilder responseStrBuilder = new StringBuilder();

		String inputStr;
		while ((inputStr = streamReader.readLine()) != null)
		    responseStrBuilder.append(inputStr);


		String responseString = responseStrBuilder.toString();

		return ok(responseString);

	}

	public static Result fetchItemDetails(String itemId) throws Exception {

		String url = "http://cloud.feedly.com/v3/entries/" + URLEncoder.encode(itemId, "UTF-8");
		String OAUTH_TOKEN = "A1it7y_rIHtTT1x9gLFdIqPiXYdmM-XouW9IOuRCgB2lN2I02eP7L8GiLZHBwU2iCk6gejHuNsYLqFQ05PFKS2EdzVNEp04h9W7L9IPwOcpSm18wZlmmMGC2n1z2n7DJcrRWKvXph8eS3InoRhkcALGQVo6EctZcuTNFjD5lXL8D4EKOseEVHkgC6jIjP2wYVx2t9E_uFBef4iaVZXapwrTESo2qB9do-_R7ZA:feedlydev";

		HttpClient client = new DefaultHttpClient();
		HttpGet request = new HttpGet(url);

		// add request headers
		request.addHeader("Authorization", "OAuth " + OAUTH_TOKEN);
		request.addHeader("Content-Type","application/json");


		HttpResponse response = client.execute(request);
		//HttpEntity resEntity = response.getEntity();

		System.out.println("\nSending 'GET' request to URL : " + url);
		System.out.println("Response Code : " +
                       response.getStatusLine().getStatusCode());


		BufferedReader streamReader = new BufferedReader(new InputStreamReader(response.getEntity().getContent(), "UTF-8"));
		StringBuilder responseStrBuilder = new StringBuilder();

		String inputStr;
		while ((inputStr = streamReader.readLine()) != null)
		    responseStrBuilder.append(inputStr);


		String responseString = responseStrBuilder.toString();


		System.out.println("Response : " + responseString);


		return ok(responseString);

	}

	public static Result fetchItemHTML(String itemUrl) throws Exception {
		// try {
    //         final HTMLDocument htmlDoc = HTMLFetcher.fetch(new URL(itemUrl));
    //         final TextDocument doc = new BoilerpipeSAXInput(htmlDoc.toInputSource()).getTextDocument();
		// 				final BoilerpipeExtractor extractor = CommonExtractors.ARTICLE_EXTRACTOR;
		// 				//final BoilerpipeExtractor extractor = CommonExtractors.KEEP_EVERYTHING_EXTRACTOR;
		// 				//final BoilerpipeExtractor extractor = CommonExtractors.DEFAULT_EXTRACTOR;
		// 				//final BoilerpipeExtractor extractor = CommonExtractors.CANOLA_EXTRACTOR;
		// 				//final BoilerpipeExtractor extractor = CommonExtractors.LARGEST_CONTENT_EXTRACTOR;
		//
		//
		//
		// 				//highlight
		// 				final HTMLHighlighter hh = HTMLHighlighter.newExtractingInstance();
		// 				//System.out.println("HIGHLIGHTED HTML : " + hh.process(new URL(itemUrl), extractor));
		//
    //         String content = ArticleExtractor.INSTANCE.getText(doc);
		// 				//String content = hh.process(new URL(itemUrl), extractor);
		//
		//
		// 				// List<TextBlock> textBlocks = doc.getTextBlocks();
		// 				// for (TextBlock textBlock : textBlocks) {
		// 				// 	System.out.println("TEXT BLOCK LABEL : " + textBlock.getText());
		// 				// }
		//
    //         return ok(content);
    //     } catch (Exception e) {
    //         return badRequest("Invalid operation class FeedsFetcher");
    //     }


		//String url = "http://api.diffbot.com/v3/article?token=3b36ec5e68e944f0cd2477d85bda3ff4&url=" + URLEncoder.encode(itemUrl, "UTF-8");
		String url = itemUrl;
		System.out.println("\nSending 'GET' request to URL : " + url);

		HttpClient client = new DefaultHttpClient();
		HttpGet request = new HttpGet(url);

		// add request headers
		request.addHeader("User-Agent", "Mozilla/5.0");

		HttpResponse response = client.execute(request);
		//HttpEntity resEntity = response.getEntity();

		System.out.println("\nSending 'GET' request to URL : " + url);
		System.out.println("Response Code : " +
                       response.getStatusLine().getStatusCode());

		// URL url_ = new URL(url);
    // // NOTE: Use ArticleExtractor unless DefaultExtractor gives better results for you
    // String text = ArticleExtractor.INSTANCE.getText(url_);
		//
		// System.out.println("Response Text : " + text);


		BufferedReader streamReader = new BufferedReader(new InputStreamReader(response.getEntity().getContent(), "UTF-8"));
		StringBuilder responseStrBuilder = new StringBuilder();

		String inputStr;
		while ((inputStr = streamReader.readLine()) != null)
		    responseStrBuilder.append(inputStr);


		String responseString = responseStrBuilder.toString();




		Document doc = Jsoup.parse(responseString);
		Elements paragraphs = doc.select("p");



		//System.out.println("Response : " + parent.html());

		for (Element p : paragraphs) {
			System.out.println("PARAGRAPH TEXT LENGTH: " + p.text().length());
			if (p.text().length() > 300 )
				return ok(p.parent().html());
		}



		//String jsonP = new Gson().toJson(paragraphs);

		return ok(responseString);

	}

}
