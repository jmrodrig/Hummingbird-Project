# --- !Ups


ALTER TABLE `lir_backoffice`.`stories`
CHANGE COLUMN `summary` `summary` LONGTEXT CHARACTER SET 'utf8' NULL DEFAULT NULL ,
CHANGE COLUMN `content` `content` LONGTEXT CHARACTER SET 'utf8' NULL DEFAULT NULL ,
CHANGE COLUMN `location_name` `location_name` VARCHAR(555) CHARACTER SET 'utf8' NULL DEFAULT NULL ,
CHANGE COLUMN `article_title` `article_title` VARCHAR(255) CHARACTER SET 'utf8' NULL DEFAULT NULL ,
CHANGE COLUMN `article_description` `article_description` LONGTEXT CHARACTER SET 'utf8' NULL DEFAULT NULL ,
CHANGE COLUMN `article_author` `article_author` VARCHAR(45) CHARACTER SET 'utf8' NULL DEFAULT NULL ;


# --- !Downs

ALTER TABLE `lir_backoffice`.`stories`
CHANGE COLUMN `summary` `summary` LONGTEXT CHARACTER SET 'utf8' NULL DEFAULT NULL ,
CHANGE COLUMN `content` `content` LONGTEXT CHARACTER SET 'utf8' NULL DEFAULT NULL ,
CHANGE COLUMN `location_name` `location_name` VARCHAR(555) CHARACTER SET 'utf8' NULL DEFAULT NULL ,
CHANGE COLUMN `article_title` `article_title` VARCHAR(255) CHARACTER SET 'utf8' NULL DEFAULT NULL ,
CHANGE COLUMN `article_description` `article_description` LONGTEXT CHARACTER SET 'utf8' NULL DEFAULT NULL ,
CHANGE COLUMN `article_author` `article_author` VARCHAR(45) CHARACTER SET 'utf8' NULL DEFAULT NULL ;
