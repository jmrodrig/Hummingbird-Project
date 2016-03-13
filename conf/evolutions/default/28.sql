# --- !Ups

ALTER TABLE `lir_backoffice`.`stories`
CHANGE COLUMN `article_link` `article_link` LONGTEXT NULL DEFAULT NULL ;

# --- !Downs

ALTER TABLE `lir_backoffice`.`stories`
CHANGE COLUMN `article_link` `article_link` VARCHAR(255) NULL DEFAULT NULL ;
