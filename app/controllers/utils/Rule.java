package controllers.utils;


public class Rule {

  private String host;
  private String strategy;
  private String value;

  // constructors for class Rule //

  Rule() {};

  Rule(String h, String s, String v) {
    host = h;
    strategy = s;
    value = v;
  }

  // methods for class Rule //

  public String getHost() {
    return host;
  }

  public String getStrategy() {
    return strategy;
  }

  public String getValue() {
    return value;
  }
}
