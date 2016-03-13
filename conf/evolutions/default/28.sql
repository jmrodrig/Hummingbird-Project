# --- !Ups

ALTER TABLE `lir_backoffice`.`stories`
CHANGE COLUMN `article_link` `article_link` LONGTEXT NULL DEFAULT NULL ,
CHANGE COLUMN `article_image` `article_image` LONGTEXT NULL DEFAULT NULL ;

# --- !Downs

ALTER TABLE `lir_backoffice`.`stories`
CHANGE COLUMN `article_link` `article_link` VARCHAR(555) NULL DEFAULT NULL ,
CHANGE COLUMN `article_image` `article_image` VARCHAR(255) NULL DEFAULT NULL ;
