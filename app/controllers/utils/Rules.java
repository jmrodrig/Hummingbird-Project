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

	private List<controllers.utils.Rule> rulesList = new ArrayList<>();
	private Path pathToRulesFile;

	// constructors for class Rules //

	Rules() {}

	Rules(String path) {
		readRulesFile(path);
	}

	// methods for class Rules //

	public void addRule(String host, String strategy, String value) {
		controllers.utils.Rule rule = new controllers.utils.Rule(host,strategy,value);
		rulesList.add(rule);
	}

	public void addRule(controllers.utils.Rule rule) {
		rulesList.add(rule);
	}

	public List<controllers.utils.Rule> getRulesList() {
		return rulesList;
	}


	public void readRulesFile(String filepath) {
		try {
			// TODO: keep rules in memory
			pathToRulesFile = Paths.get(filepath);
			List<String> ruleLinesText = Files.readAllLines(pathToRulesFile, ENCODING);
			for (String ruleText : ruleLinesText) {
				String host = ruleText.split(",")[0];
				String strategy = ruleText.split(",")[1];
				String value = ruleText.split(",")[2];
				controllers.utils.Rule rule = new controllers.utils.Rule(host,strategy,value);
				rulesList.add(rule);
				//System.out.println("=> RULE: " + ruleText);
			}
		}
		catch (IOException ioe) {
			System.out.println("=> ERROR: " + ioe);
		}
	}

	public controllers.utils.Rules getRulesByHost(String host) {
		Rules rules = new Rules();
		for (Rule r : rulesList) {
			if (r.getHost().equals(host))
				rules.addRule(r);
		}
		return rules;
	}

	public static Result setNewRule() throws Exception {
		// TODO: open file in buffer mode (BufferedWriter) instead
		controllers.json.Rule jsonRule = new Gson().fromJson(request().body().asJson().toString(), controllers.json.Rule.class);
		String rulesPath = Play.current().path().getAbsolutePath() + "/private/scrapingrules/";
		Path path = Paths.get(rulesPath + jsonRule.filePath);
		Files.write(path, Arrays.asList(jsonRule.host + "," + jsonRule.strategy + "," + jsonRule.value), ENCODING, StandardOpenOption.APPEND);
		return ok();
	}

}
