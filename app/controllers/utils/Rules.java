package controllers.utils;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.nio.file.StandardOpenOption;
import java.io.IOException;
import java.util.List;
import java.util.Arrays;
import java.util.ArrayList;


import org.jsoup.select.Elements;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.Jsoup;

import play.api.Play;
import play.mvc.Controller;
import play.mvc.Result;

import com.google.gson.Gson;
import play.mvc.BodyParser;
import play.mvc.Http.MultipartFormData;
import play.mvc.Http.MultipartFormData.FilePart;
import play.mvc.Http.RequestBody;
import com.google.gson.Gson;

public class Rules extends Controller {

	final static Charset ENCODING = StandardCharsets.UTF_8;

	private List<Rule> rulesList = new ArrayList<>();
	private Path pathToRulesFile;

	public Rules(String path) {
		readRulesFile(path);
	}

	public void readRulesFile(String filepath) {
		try {
			// TODO: keep rules in memory
			pathToRulesFile = Paths.get(filepath);
			List<String> ruleLinesText = Files.readAllLines(pathToRulesFile, ENCODING);
			for (String ruleText : ruleLinesText) {
				Rule rule = new Rule();
				rule.host = ruleText.split(",")[0];
				rule.strategy = ruleText.split(",")[1];
				rule.value = ruleText.split(",")[2];
				rulesList.add(rule);
				//System.out.println("=> RULE: " + ruleText);
			}
		}
		catch (IOException ioe) {
			System.out.println("=> ERROR: " + ioe);
		}
	}

	public String getHostStrategy(String host) {
		for (Rule r : rulesList) {
			if (r.host.equals(host))
				return r.strategy;
		}
		return "";
	}

	public String getHostValue(String host) {
		for (Rule r : rulesList) {
			if (r.host.equals(host))
				return r.value;
		}
		return "";
	}

	public static Result setNewRule() throws Exception {
		// TODO: open file in buffer mode (BufferedWriter) instead
		controllers.json.Rule jsonRule = new Gson().fromJson(request().body().asJson().toString(), controllers.json.Rule.class);
		String rulesPath = Play.current().path().getAbsolutePath() + "/private/scrapingrules/";
		Path path = Paths.get(rulesPath + jsonRule.filePath);
		Files.write(path, Arrays.asList(jsonRule.host + "," + jsonRule.strategy + "," + jsonRule.value), ENCODING, StandardOpenOption.APPEND);
		return ok();
	}


	class Rule {
		String host;
		String strategy;
		String value;
	}
}
