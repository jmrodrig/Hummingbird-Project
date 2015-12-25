import sbt._
import Keys._
import play.Project._

object ApplicationBuild extends Build {

    val appName         = "backoffice"
    val appVersion      = "0.0.1"

    val appDependencies = Seq(
		javaCore,
		javaJdbc,
		javaEbean,
		"mysql" % "mysql-connector-java" % "5.1.22",
		"securesocial" %% "securesocial" % "2.1.2",
		"com.typesafe.play.plugins" %% "play-plugins-mailer" % "2.3.1"
    )

    val main = play.Project(appName, appVersion, appDependencies).settings(
		resolvers += Resolver.url("sbt-plugin-releases", new URL("http://repo.scala-sbt.org/scalasbt/sbt-plugin-releases/"))(Resolver.ivyStylePatterns),
		playAssetsDirectories <+= baseDirectory / "public/upload/",
		playAssetsDirectories <+= baseDirectory / "public/upload/images/",
		playAssetsDirectories <+= baseDirectory / "public/upload/stories/tmp/"
    )
    
    
}
