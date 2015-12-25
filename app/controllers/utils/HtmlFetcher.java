package controllers.utils;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;

import org.apache.commons.lang3.StringEscapeUtils;
import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.DefaultHttpClient;

public class HtmlFetcher {
	
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
	public Metadata grabMetadataFromHtml(String html, String url) {
		Metadata metadata = new Metadata();
        String headerHtml = html.split("<body")[0];

        //Description Regexs
        String[] descriptionRegexs = {
                "<meta name=\"twitter:description\"",
                "<meta property=\"twitter:description\"",
                "<meta property=\"og:description\"",
                "<meta name=\"description\""
        };

        metadata.description = 
                StringEscapeUtils.unescapeHtml4(parseRegex(headerHtml, descriptionRegexs));

        //title Regexs
        String[] titleRegexs = {
                "<meta name=\"twitter:title\"",
                "<meta property=\"twitter:title\"",
                "<meta property=\"og:title\"",
                "<meta itemprop=\"name\"",
                "<meta name=\"title\""
        };
        metadata.title = 
                StringEscapeUtils.unescapeHtml4(parseRegex(headerHtml, titleRegexs));

        //image Regexs
        String[] imageRegexs = {
                "<meta name=\"twitter:image:src\" ",
                "<meta property=\"og:image\"",
                "<meta itemprop=\"image\""
        };
        metadata.imageUrl = parseRegex(headerHtml, imageRegexs);
        
        //host
        String host = url.split("//")[1].split("/")[0];
        metadata.host = host;
        
        return metadata;
        
	}
	
	private String parseRegex(String header, String[] rgs) {
        if (header.equals(""))
            return "";

        String dcrpRegex = "";
        for (String rg : rgs) {
            if (header.contains(rg)) {
                dcrpRegex = rg;
                break;
            }
        }

        if (dcrpRegex != "") {
            return header.split(dcrpRegex, 2)[1]
                    .split("content=\"", 2)[1]
                    .split("\"", 2)[0];
        }
        return "";
    }
	
	class Metadata {
		String title;
		String description;
		String imageUrl;
		String host;
	}

}
